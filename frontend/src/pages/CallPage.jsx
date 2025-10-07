import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useWebRTC } from "../hooks/useWebRTC.jsx";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";

const CallPage = () => {
  const { id: targetUserId } = useParams();
  const { authUser } = useAuthUser();
  const {
    localStream,
    remoteStream,
    isCallActive,
    callStatus,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    currentCall,
  } = useWebRTC();

  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const fetchTargetUser = async () => {
      try {
        const response = await fetch(`http://localhost:5050/api/users/${targetUserId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setTargetUser(userData);
        }
      } catch (error) {
        console.error("Error fetching target user:", error);
      }
    };

    if (targetUserId) {
      fetchTargetUser();
    }
  }, [targetUserId]);

  useEffect(() => {
    if (callStatus === "ringing" && currentCall && currentCall.targetUserId === authUser?.uid) {
      setShowIncomingCall(true);
      setIncomingCallData(currentCall);
    } else if (callStatus !== "ringing") {
      setShowIncomingCall(false);
      setIncomingCallData(null);
    }
  }, [callStatus, currentCall, authUser?.uid]);

  const handleAcceptCall = () => {
    if (incomingCallData) {
      acceptCall(incomingCallData);
      setShowIncomingCall(false);
    }
  };

  const handleRejectCall = () => {
    if (incomingCallData) {
      rejectCall(incomingCallData.id);
      setShowIncomingCall(false);
      setIncomingCallData(null);
    }
  };

  const handleEndCall = () => {
    endCall();
  };

  if (!authUser) {
    return <PageLoader />;
  }

  if (showIncomingCall && incomingCallData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4">
              <img
                src={targetUser?.profilePic || "/default-avatar.png"}
                alt={targetUser?.fullName || "User"}
                className="w-20 h-20 rounded-full mx-auto mb-2"
              />
              <h3 className="text-lg font-semibold">{targetUser?.fullName}</h3>
              <p className="text-gray-600">
                Incoming {incomingCallData.callType} call...
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleAcceptCall}
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full"
              >
                <Phone size={24} />
              </button>
              <button
                onClick={handleRejectCall}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCallActive || callStatus !== "idle") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            {callStatus === "calling" && "Calling..."}
            {callStatus === "ringing" && "Ringing..."}
            {callStatus === "connecting" && "Connecting..."}
            {callStatus === "connected" && "Connected"}
          </div>
        </div>
        <div className="bg-gray-900 p-4 flex justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${localStream?.getAudioTracks()[0]?.enabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"} text-white`}
          >
            {localStream?.getAudioTracks()[0]?.enabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${localStream?.getVideoTracks()[0]?.enabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"} text-white`}
          >
            {localStream?.getVideoTracks()[0]?.enabled ? <Video size={24} /> : <VideoOff size={24} />}
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

export default CallPage;
