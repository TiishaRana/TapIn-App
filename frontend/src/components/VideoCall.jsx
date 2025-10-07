import { useEffect, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC.jsx";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";

const VideoCall = ({ onEndCall }) => {
  const {
    localStream,
    remoteStream,
    isCallActive,
    callStatus,
    localVideoRef,
    remoteVideoRef,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    currentCallId,
  } = useWebRTC();

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    if (!isCallActive && callStatus === "idle") {
      onEndCall?.();
    }
  }, [isCallActive, callStatus, onEndCall]);

  const handleEndCall = () => {
    endCall();
  };

  const handleToggleVideo = () => {
    const enabled = toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleToggleAudio = () => {
    const enabled = toggleAudio();
    setIsAudioEnabled(enabled);
  };

  // No need for incoming call modal here, useWebRTC handles the toast directly

  // Active call interface
  if (isCallActive || (callStatus !== "idle" && currentCallId)) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Video containers */}
        <div className="flex-1 relative">
          {/* Remote video (main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local video (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Call status */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            {callStatus === "calling" && "Calling..."}
            {callStatus === "ringing" && "Ringing..."}
            {callStatus === "connecting" && "Connecting..."}
            {callStatus === "connected" && "Connected"}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 p-4 flex justify-center space-x-4">
          <button
            onClick={handleToggleAudio}
            className={`p-3 rounded-full ${
              isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
            } text-white`}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          
          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-full ${
              isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
            } text-white`}
          >
            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
          
          <button
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoCall;
