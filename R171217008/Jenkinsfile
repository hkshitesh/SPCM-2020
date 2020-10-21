def awsCredentials = [[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-personal']]
pipeline {
    environment{
    registryCredential = 'spiner-dockerhub'
    }
    agent none
    stages {
        stage('Build') {
            agent { dockerfile true }
            steps {
                sh 'pwd'
                sh 'npm build'
            }
        }
    stage('Deploy'){
        agent any
        steps {
            script {
       docker.withRegistry( '', registryCredential ){
            def customImage = docker.build("always2kspiner/webproject:${env.BUILD_ID}")
            customImage.push()
                    }   
                }
            }
        }
        stage('AWS Deployment'){
            agent any
            steps{
                script{
                    withCredentials(awsCredentials){
                dir('TerraformScripts'){
                sh 'terraform init'
                sh 'terraform apply -auto-approve'
                }
                    }
                }
            }
        }
    }
}
