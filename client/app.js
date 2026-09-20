const socket = new WebSocket("ws://localhost:8080");
let pc = null;

socket.onopen = () => {
  console.log("Connected to signaling server");
};

socket.onmessage = async (event) => {
  const text =
    event.data instanceof Blob ? await event.data.text() : event.data;
  const message = JSON.parse(text);
  console.log("Message received:", message.type);

  if (message.type === "offer") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc = new RTCPeerConnection();

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: "ice", candidate: event.candidate }),
        );
      }
    };

    pc.ontrack = (event) => {
      const remoteAudio = document.getElementById("remoteAudio");
      remoteAudio.srcObject = event.streams[0];
      console.log("Remote audio received");
    };

    await pc.setRemoteDescription(message.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: "answer", sdp: answer }));
    console.log("Answer sent");
  }

  if (message.type === "answer") {
    await pc.setRemoteDescription(message.sdp);
    console.log("Answer received");
  }

  if (message.type === "ice") {
    await pc.addIceCandidate(message.candidate);
    console.log("ICE candidate added");
  }
};

async function startCall() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  pc = new RTCPeerConnection();

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
      console.log("ICE candidate sent");
    }
  };

  pc.ontrack = (event) => {
    const remoteAudio = document.getElementById("remoteAudio");
    remoteAudio.srcObject = event.streams[0];
    console.log("Remote audio received");
  };

  stream.getTracks().forEach((track) => pc.addTrack(track, stream));

  console.log("Microphone captured, peer connection created");

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.send(JSON.stringify({ type: "offer", sdp: offer }));
  console.log("Offer sent");
}

document.getElementById("call").onclick = startCall;
