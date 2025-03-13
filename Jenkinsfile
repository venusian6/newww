pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
        MONGO_URI = "mongodb+srv://harrypotter007007007007:abc@cluster0.c74zw.mongodb.net/superaData"
        MONGO_DB_CREDS = credentials('mongo-db-credentials')
        MONGO_USERNAME = credentials('mongo-db-username-without-pair')
        MONGO_PASSWORD = credentials('mongo-db-pass-without-pair')
        SONAR_SCANNER_HOME = tool name: 'sonarqube-scanner-7.0.2'
        GITHUB_TOKEN=credentials('githhubb-token')
    }

    options {
        disableResume()
        disableConcurrentBuilds abortPrevious: true
    }

    stages {
        stage('Checking the working') {
            steps {
                sh '''
                node -v
                npm -v
                echo 'It is working right'
                '''
            }
        }

        stage('Install dependencies') {
            options {
                timestamps()
            }
            steps {
                sh 'npm install --no-audit'
            }
        }

        stage('Dependency Check') {
             when {
                branch 'PR*'
            }
            parallel {
                stage('NPM Dependency Audit') {
                    steps {
                        sh '''npm audit --audit-level=critical
                        echo $?
                        '''
                    }
                }

                stage('OWASP Dependency check') {
                    steps {
                        dependencyCheck additionalArguments: '''
                        --scan ./ 
                        --out ./ 
                        --format ALL
                        --prettyPrint
                        --disableYarnAudit
                        ''', nvdCredentialsId: 'NVD_API_KEY', odcInstallation: 'OWASP-DEPCHECK-12'

                        dependencyCheckPublisher failedTotalCritical: 1, failedTotalHigh: 2, failedTotalLow: 90, failedTotalMedium: 4, pattern: 'dependency-check-report.xml', stopBuild: true
                    }
                }
            }
        }

        stage('Unit testing') {
            options {
                retry(2)
            }
            steps {
                sh 'echo "Colon-seperated - $MONGO_DB_CREDS"'
                sh 'echo "Username - $MONGO_DB_CREDS_USR"'
                sh 'echo "Password -$MONGO_DB_CREDS_PSW"'
                sh 'npm test'
            }
        }

        stage('Code coverage') {
            steps {
                catchError(buildResult: 'SUCCESS', message: 'Oops it will be fixed in future release') {
                    sh 'npm run coverage'
                }
            }
        }

        stage('SAST-SonarQube') {
            steps {
                // timeout(time: 60, unit: 'SECONDS') {                
                    withSonarQubeEnv('sonar-qube-server') {
                        sh 'echo $SONAR_SCANNER_HOME'
                        sh '''
                        echo $SONAR_SCANNER_HOME
                        $SONAR_SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectKey=solar-system \
                        -Dsonar.sources=app.js \
                        -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info

                        '''
                    }
                // }
                waitForQualityGate abortPipeline: true
            }
        }

        stage('Docker Image Build'){
            steps{
                sh 'docker build -t thevenusian/solar:$GIT_COMMIT .'
            }
        }
        
    

        stage('Trivy Vulnerability Scanner'){
            steps {
                sh '''
                trivy image thevenusian/solar:$GIT_COMMIT \
                --severity LOW,MEDIUM,HIGH \
                --exit-code 0 \
                --quiet \
                --format json -o trivy-image-MEDIUM-results.json
                
                trivy image thevenusian/solar:$GIT_COMMIT \
                --severity CRITICAL \
                --exit-code 1 \
                --quiet \
                --format json -o trivy-image-CRITICAL-results.json
                '''
            }
            post {
                always {
                    sh '''
                    trivy convert \
                        --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                        --output trivy-image-MEDIUM-results.html trivy-image-MEDIUM-results.json
                    
                    trivy convert \
                        --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                        --output trivy-image-CRITICAL-results.html trivy-image-CRITICAL-results.json
                    
                    trivy convert \
                        --format template --template "@/usr/local/share/trivy/templates/junit.tpl" \
                        --output trivy-image-MEDIUM-results.xml trivy-image-MEDIUM-results.json
                    
                    trivy convert \
                        --format template --template "@/usr/local/share/trivy/templates/junit.tpl" \
                        --output trivy-image-CRITICAL-results.xml trivy-image-CRITICAL-results.json
                    '''
                }
            }
        }
        stage('Push Image to Registry'){
            steps{
                withDockerRegistry(credentialsId: 'docker-hub-credentials', url: '') {
                            sh 'docker push thevenusian/solar:$GIT_COMMIT'
}

                
            }
        }

            stage('Deploy aws-ec2-devoployment'){
            when {
                     branch 'feature/*'
                 }


            steps{
                script{

                
    script {
        sshagent(['aws-dev-deploy-ec2-instance']) {
            sh '''
                echo $MONGO_URI
                echo $MONGO_PASSWORD
                echo $MONGO_USERNAME
                echo $GIT_COMMIT
                ssh -o StrictHostKeyChecking=no ubuntu@13.201.222.45 <<EOF
                export MONGO_URI=$MONGO_URI
                export MONGO_PASSWORD=$MONGO_PASSWORD
                export MONGO_USERNAME=$MONGO_USERNAME
                export GIT_COMMIT=$GIT_COMMIT

                if sudo docker ps -a | grep -q "solar"; then
                    echo "Container found. Stopping..."
                    sudo docker stop "solar" && sudo docker rm "solar"
                    echo "Container stopped and removed."
                fi
                sudo docker run --name solar \
                    -e MONGO_URI=$MONGO_URI \
                    -e MONGO_PASSWORD=$MONGO_PASSWORD \
                    -e MONGO_USERNAME=$MONGO_USERNAME \
                    -p 3000:3000 -d thevenusian/solar:$GIT_COMMIT
EOF
            '''
        }
    }

                }
                 }
        }
        stage('Integration Testing AWS-EC2 '){
             when {
                     branch 'feature/*'
                 }
            steps {
                sh'echo this is stage integration testing'
                sh 'printenv | grep -i branch'
                withAWS(credentials:'aws-s3-ec2-lambda-credentials', region: 'ap-south-1') {
                sh ''' 
                    bash integration-testing-ec2.sh
                '''
            }}
        }
        stage('Kubernetes Update Image Tag'){

            when {
                branch 'PR*'
            }
            steps{
            git url: 'https://github.com/venusian6/gitops.git', branch: 'main'

            sh 'pwd'

            dir('gitops/kubernetes') {
            sh '''
            # Fix Git Safe Directory Issue
            git config --global --add safe.directory /var/lib/jenkins/workspace/Solar-Multi-Branch_PR-8
            # Ensure the latest changes are fetched
            git checkout main
            git pull origin main  # Pull latest changes to avoid conflicts
            git checkout -b feature-$BUILD_ID
            pwd
            # Replace Docker Tag
            cat /var/lib/jenkins/workspace/Solar-Multi-Branch_PR-8/kubernetes/deployment.yml
            cd /var/lib/jenkins/workspace/Solar-Multi-Branch_PR-8/kubernetes
            # old-code with old tag  sed -i "s#siddharth67/solar-system:v9.*#thevenusian/solar:$GIT_COMMIT#g" deployment.yml
            sed -i "s|thevenusian/solar:[a-f0-9]\\{40\\}|thevenusian/solar:$GIT_COMMIT|g" deployment.yml


            # Git Config for Committ
            git config --global user.email "vivektheviperrockss@gmail.com"
            git config --global user.name "venusian6"
            git remote set-url origin https://$GITHUB_TOKEN@github.com/venusian6/gitops.git

            # Add the modified file explicitly
            echo "Manually adding deployment.yml"
            git add deployment.yml

            # Check status to confirm the file is staged
            echo "Checking Git Status:"
            git status

            # Commit and push changes
            git commit -m "Update docker image"
            git push -u origin feature-$BUILD_ID

            '''
            //  # Commit and push to feature branchh
            // git config --global user.email "vivektheviperrockss@gmail.com"
            // git config --global user.name "venusian6"
            // git remote set-url origin https://$GITHUB_TOKEN@github.com/venusian6/gitops.git
            // git add .
            // git commit -m "Update docker image"
            // git push -u origin feature-$BUILD_ID
        }

            }
                }


        stage ('Raise PR'){
            when {
                branch 'PR*'
            }

            steps{
                sh 'echo helloo'
                sh '''
                    curl -X POST \
                -H "Accept: application/vnd.github+json" \
                -H "Authorization: Bearer ${GITHUB_TOKEN}" \
                -H "X-GitHub-Api-Version: 2022-11-28" \
                https://api.github.com/repos/venusian6/gitops/pulls \
                -d '{
                    "title": "Merge feature-${BUILD_ID} into main",
                    "body": "This pull request merges feature-${BUILD_ID} into main.",
                    "head": "feature-${BUILD_ID}",
                    "base": "main"
                }'
                '''

                }

        }


// stage('Kubernetes Update Image Tag') {
//     when {
//         branch 'PR*'
//     }
//     steps {
//         script {
//             // Ensure repository is clonedd
//             if (!fileExists('gitops')) {
//                 sh 'git clone https://github.com/venusian6/gitops.git'
//             }

//             dir('gitops/kubernetes') {


//                 sh '''
//                     git config --global user.email "vivektheviperrockss@gmail.com"
//                     git config --global user.name "venusian6"
//                     git checkout main
//                     git pull origin main --allow-unrelated-histories || true

//                     # Resolve conflicts automatically (keeping the remote version)
//                     git reset --hard origin/main
//                     git checkout -b feature-$BUILD_ID

//                     # Ensure deployment.yaml exists
//                     if [ ! -f "gitops/kubernetes/deployment.yl" ]; then
//                         echo "Error: deployment.yml not found!"
//                         exit 1
//                     fi

//                     # Update image tag in deployment.yaml
//                     sed -i "s#siddharth67/solar-system:v9.*#thevenusian/solar:$GIT_COMMIT#g" gitops/kubernetes/deployment.yml

//                     # Commit and push
//                     git add gitops/kubernetes/deployment.yml
//                     git commit -m "Update docker image to $GIT_COMMIT"
//                     git push -u origin feature-$BUILD_ID
// '''

                
 



//             }
//         }
//     }
// }



// stage('Kubernetes Update Image Tag') {
//     when {
//         branch 'PR*'
//     }
//     steps {
//         script {
//             // Clone repo if it doesn't exist
//             if (!fileExists('gitops')) {
//                 sh 'git clone https://github.com/venusian6/gitops.git'
//             }

//             // Ensure kubernetes directory existss
//             if (!fileExists('gitops/kubernetes')) {
//                 error("Error: 'kubernetes' directory not found inside 'gitops'. Check repo structure.")
//             }

//             dir('gitops/kubernetes') {
//                 sh '''
//                 git checkout main
//                 git pull origin main
//                 git checkout -b feature-$BUILD_ID || git checkout feature-$BUILD_ID
                
//                 # Ensure deployment.yaml exists
//                 if [ -f "deployment.yaml" ]; then
//                     sed -i "s#siddharth67/solar-system:v9.*#thevenusian/solar:$GIT_COMMIT#g" deployment.yaml
//                     git add deployment.yaml
//                     git commit -m "Update docker image"
//                     git push -u origin feature-$BUILD_ID
//                 else
//                     echo "Error: deployment.yaml not found!"
//                     exit 1
//                 fi
//                 '''
//             }
//         }
//     }
// }




    }

    post {
        always {
            // script{
            //     if (fileExists('gitops')){
            //         sh 'rm -rf gitops'
            //     }
            // }
            junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'test-results.xml'
            junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'dependency-check-junit.xml'
            junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'trivy-image-MEDIUM-results.xml'
            junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'trivy-image-CRITICAL-results.xml'
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: 'coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code Coverage HTML Report', reportTitles: '', useWrapperFileDirectly: true])
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'dependency-check-report.html', reportName: 'HTML Report', reportTitles: '', useWrapperFileDirectly: true])
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'trivy-image-MEDIUM-results.json', reportName: 'Trivy Image Medium Vul Report', reportTitles: '', useWrapperFileDirectly: true])
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'trivy-image-CRITICAL-results.json', reportName: 'Trivy Image Critical Vul Report', reportTitles: '', useWrapperFileDirectly: true])
        }
    }
}
//