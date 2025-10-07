import { useRef, useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import useAuthUser from "./useAuthUser";
import {
  createCall,
  updateCallStatus,
  sendOffer,
  sendAnswer,
  addIceCandidate,
  subscribeToCall,
  deleteCall,
  subscribeIncoming,
} from "../lib/callService";

export const useWebRTC = () => {
  const { authUser } = useAuthUser();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, ringing, connected
  const [currentCallId, setCurrentCallId] = useState(null);
  
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const currentCallRef = useRef(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  const createPeerConnection = useCallback((callId, userId) => {
    const peerConnection = new RTCPeerConnection(iceServers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && callId && userId) {
        addIceCandidate(callId, userId, event.candidate.toJSON());
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      if (peerConnection.connectionState === "disconnected" || 
                 peerConnection.connectionState === "failed") {
        endCall();
      }
    };

    return peerConnection;
  }, []);

  const getLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }, []);

  const initiateCall = useCallback(async (targetUserId, callType = "video", chatId) => {
    if (!authUser?.id) {
      toast.error("You must be logged in to initiate a call.");
      return;
    }

    try {
      setCallStatus("calling");
      
      const { callId } = await createCall(authUser.id, targetUserId, callType, chatId);
      setCurrentCallId(callId);

      const stream = await getLocalStream(callType === "video", true);
      const peerConnection = createPeerConnection(callId, authUser.id);
      peerConnectionRef.current = peerConnection;
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await sendOffer(callId, offer.toJSON());

      currentCallRef.current = { callId, targetUserId, callType, chatId, callerId: authUser.id };
      setIsCallActive(true);
      toast.success("Calling...");

      // Listen for answer and ICE candidates
      subscribeToCall(callId, (callData) => {
        if (!callData) {
          toast.error("Call ended by recipient.");
          endCall();
          return;
        }
        if (callData.answer && peerConnectionRef.current && peerConnectionRef.current.signalingState !== "stable") {
          peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(callData.answer));
          setCallStatus("connected");
        }
        if (callData.iceCandidates && callData.iceCandidates[targetUserId]) {
          callData.iceCandidates[targetUserId].forEach(candidate => {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          });
        }
        if (callData.status === "rejected") {
          toast.error("Call rejected.");
          endCall();
        } else if (callData.status === "ended") {
          toast.info("Call ended.");
          endCall();
        }
      });

    } catch (error) {
      console.error("Error initiating call:", error);
      setCallStatus("idle");
      toast.error("Failed to initiate call");
    }
  }, [getLocalStream, createPeerConnection, authUser?.id]);

  const acceptCall = useCallback(async (callData) => {
    if (!authUser?.id) return;

    try {
      setCallStatus("connecting");
      setCurrentCallId(callData.id);
      updateCallStatus(callData.id, "accepted");

      const stream = await getLocalStream(callData.callType === "video", true);
      const peerConnection = createPeerConnection(callData.id, authUser.id);
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      await peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await sendAnswer(callData.id, answer.toJSON());

      currentCallRef.current = { ...callData, callerId: callData.callerId, targetUserId: authUser.id };
      setIsCallActive(true);
      toast.success("Call accepted.");

      // Listen for ICE candidates from the caller
      subscribeToCall(callData.id, (updatedCallData) => {
        if (!updatedCallData) {
          toast.info("Call ended by caller.");
          endCall();
          return;
        }
        if (updatedCallData.iceCandidates && updatedCallData.iceCandidates[callData.callerId]) {
          updatedCallData.iceCandidates[callData.callerId].forEach(candidate => {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          });
        }
        if (updatedCallData.status === "ended") {
          toast.info("Call ended.");
          endCall();
        }
      });

    } catch (error) {
      console.error("Error accepting call:", error);
      setCallStatus("idle");
      toast.error("Failed to accept call");
    }
  }, [getLocalStream, createPeerConnection, authUser?.uid]);

  const rejectCall = useCallback(async (callId) => {
    try {
      await updateCallStatus(callId, "rejected");
      await deleteCall(callId);
      setCallStatus("idle");
      toast.error("Call rejected.");
    } catch (error) {
      console.error("Error rejecting call:", error);
      toast.error("Failed to reject call");
    }
  }, []);

  const endCall = useCallback(async () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setRemoteStream(null);
    
    if (currentCallId) {
      await deleteCall(currentCallId);
    }

    setIsCallActive(false);
    setCallStatus("idle");
    setCurrentCallId(null);
    currentCallRef.current = null;
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    toast.success("Call ended");
  }, [localStream, currentCallId]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  useEffect(() => {
    if (!authUser?.id) return;
    // Subscribe to in-memory incoming calls
    const unsubscribe = subscribeIncoming(authUser.id, (incomingCall) => {
      if (!incomingCall) return;
      toast((t) => (
        <div>
          <p>Incoming {incomingCall.callType} call from {incomingCall.callerId}</p>
          <button onClick={() => {
            acceptCall(incomingCall);
            toast.dismiss(t.id);
          }}>Accept</button>
          <button onClick={() => {
            rejectCall(incomingCall.id);
            toast.dismiss(t.id);
          }}>Reject</button>
        </div>
      ), { duration: Infinity });
    });
    return () => unsubscribe && unsubscribe();
  }, [authUser?.id, acceptCall, rejectCall]);

  return {
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
    currentCall: currentCallRef.current,
    currentCallId,
  };
};
