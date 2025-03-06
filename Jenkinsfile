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
                timeout(time: 60, unit: 'SECONDS') {                
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
                }
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
                ssh -o StrictHostKeyChecking=no ubuntu@13.233.12.246 <<EOF
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




    }

    post {
        always {
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
