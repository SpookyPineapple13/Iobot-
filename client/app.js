const API_BASE_URL = "http://127.0.0.1:5000"

const bCheckServerConnection = document.querySelector("#bserver-check")
const serverMessage = document.querySelector("#server-message")
async function checkConnection() {
    const response = await fetch(
        `${API_BASE_URL}/hello`
    )

    if (!response.ok) {
        serverMessage.textContent("Could not connect to the server")
        throw new Error("Could not connect to the server")
    }

    const message = await response.json()
    serverMessage.textContent = message["message"]
}
bCheckServerConnection.addEventListener("click", checkConnection)
