pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
  MONGO_URI = "mongodb+srv://harrypotter007007007007:abc@cluster0.c74zw.mongodb.net/superaData"
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
                       
                       junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'dependency-check-junit.xml'
                       

                        publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'dependency-check-report.html', reportName: 'HTML Report', reportTitles: '', useWrapperFileDirectly: true])
                    
                    }
                }
            }
        }

        stage('Unit testing'){
            options{retry(2)}
            steps{
                withCredentials([usernamePassword(credentialsId: 'mongo-db-credentials', passwordVariable: 'MONGO_PASSWORD', usernameVariable: 'MONGO_USERNAME')]) {
                      sh 'npm test'
                }
                junit allowEmptyResults: true, keepProperties: true, stdioRetention: '', testResults: 'test-results.xml'
            }
        }

        stage('Code coverage'){
             steps{
                withCredentials([usernamePassword(credentialsId: 'mongo-db-credentials', passwordVariable: 'MONGO_PASSWORD', usernameVariable: 'MONGO_USERNAME')]) {
                      sh 'npm run coverage'
                }
                
            }

        }

    }
}
