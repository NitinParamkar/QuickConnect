# QuickConnect

This is a peer-to-peer video chat application built using WebRTC for real-time communication, Node.js with Express for the backend signaling server, and Socket.IO for WebSocket communication.

It allows users to join a chat room with a username, see a list of other online users, and initiate one-on-one video calls.

## Features

*   **User Join:** Enter a username to join the chat network.
*   **Contact List:** View a list of currently online users.
*   **1-on-1 Video Calls:** Initiate video calls with other online users by clicking the call icon next to their name.
*   **Real-time Video & Audio:** Stream video and audio directly between peers using WebRTC.
*   **Local Media Controls:**
    *   Mute/Unmute microphone.
    *   Turn camera on/off.
*   **Remote Status Indicators:** See if the remote user has muted their audio or turned off their video.
*   **Call Termination:** End ongoing calls.
*   **Responsive Design:** Basic responsiveness for different screen sizes, including a collapsible contact list on smaller screens.
*   **Real-time Updates:** The contact list updates automatically when users join or leave.

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/NitinParamkar/QuickConnect.git
    cd QuickConnect
    ```

2.  **Install server dependencies:**
    ```bash
    npm install
    ```

3. **Run the Application**
    ```bash
    npm start
    ```
    The server will start, typically on port 9000.
4. **Access the Application:**
   Open your web browser and navigate to http://localhost:9000 to use the video chat app.
