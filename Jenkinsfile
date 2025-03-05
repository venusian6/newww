pipeline{

    agent any

tools   {
    nodejs 'node'
}

stages {
    stage('Checking the working '){
steps {
    sh '''
    node -v
    npm -v
    echo it working right
'''}
}
    stage('Install dependencies'){
        steps{
            sh ' npm install --no-audit'
        }
    }
    stage('Dependency Check'){

        parallel{

             stage('NPM Dependency Audit'){
        steps{
            sh '''npm audit --audit level=critical
            echo $?
            '''
        }
    }

    stage('OWASP Dependency check'){
        steps{
            dependencyCheck additionalArguments: '''--scan ./
                --out ./
                --format All
                --prettyPrint''', nvdCredentialsId: 'NVD_API_KEY', odcInstallation: 'OWASP-DEPCHECK-12'
        }
    }



        }


    }

   



}
}
