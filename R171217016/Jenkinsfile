def awsCredentials = [[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'darsh_aws']]
pipeline {
    environment{
    registryCredential = 'dockerhub_id'
    }
    agent none
    stages {
        stage('Build') {
            agent { dockerfile true }
            steps {
                sh 'npm --version'
           
            }
        }
    stage('Deploy'){
        agent any
        steps {
            script {
       docker.withRegistry( '', registryCredential ){
            def customImage = docker.build("darshasawa7899/node-jenkins-docker:${env.BUILD_ID}")
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
