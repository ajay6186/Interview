// Shared library global variable: buildAndPush
// Called as: buildAndPush(image: 'myapp', tag: '1.0.0')

def call(Map config) {
    def image = config.image ?: 'myapp'
    def tag   = config.tag   ?: 'latest'
    echo "Building image: ${image}:${tag}"
    sh "docker build -t ${image}:${tag} ."
    echo "Pushing image: ${image}:${tag}"
    // sh "docker push ${image}:${tag}"
}
