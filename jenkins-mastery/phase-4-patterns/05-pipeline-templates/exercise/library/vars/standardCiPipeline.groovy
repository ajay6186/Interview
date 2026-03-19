// Shared library: standardCiPipeline
// Usage: standardCiPipeline(image: 'node:18-alpine', testCmd: 'npm test')

def call(Map config) {
    def image    = config.getOrDefault('image',    'node:18-alpine')
    def testCmd  = config.getOrDefault('testCmd',  'npm test')
    def buildCmd = config.getOrDefault('buildCmd', 'npm run build')

    pipeline {
        agent {
            docker { image image }
        }

        stages {
            stage('Install') {
                steps {
                    sh 'npm ci'
                }
            }

            stage('Test') {
                steps {
                    sh testCmd
                }
            }

            stage('Build') {
                steps {
                    sh buildCmd
                }
            }
        }

        post {
            always {
                archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true
            }
            success {
                echo "✅ standardCiPipeline PASSED"
            }
            failure {
                echo "❌ standardCiPipeline FAILED"
            }
        }
    }
}
