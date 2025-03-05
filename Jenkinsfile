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



}
}
