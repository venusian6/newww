pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
        MONGO_URI = "mongodb+srv://harrypotter007007007007:abc@cluster0.c74zw.mongodb.net/superaData"
        MONGO_DB_CREDS=credentials('mongo-db-credentials')
        MONGO_USERNAME=credentials('mongo-db-username-without-pair')
        MONGO_PASSWORD=credentials('mongo-db-pass-without-pair')
        SONAR_SCANNER_HOME = tool name: 'sonarqube-scanner-7.0.2', type: 'ToolLocation'
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

        stage('SAST-SonarQube'){
            steps{
                sh 'echo $SONAR_SCANNER_HOME'
                sh '''
                echo $SONAR_SCANNER_HOME
                $SONAR_SCANNER_HOME/bin/sonar-scanner \
                -Dsonar.projectKey=solar-system \
                -Dsonar.sources=app.js \
                -Dsonar.host.url=http://192.168.1.12:9000 \
                -Dsonar.token=sqp_b0902a4b26ca15b97a3bcfa35949635aadc8a143 \
                -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info
                '''
            }
        }

    }

    post {
        always {
            junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'test-results.xml'
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: 'coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code Coverage HTML Report', reportTitles: '', useWrapperFileDirectly: true])
            junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'dependency-check-junit.xml'
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'dependency-check-report.html', reportName: 'HTML Report', reportTitles: '', useWrapperFileDirectly: true])
        }
    }
}
