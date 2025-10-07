// In-memory call service for development (no Firebase)
const calls = new Map(); // callId -> callData
const callSubscribers = new Map(); // callId -> Set(callback)
const incomingSubscribers = new Map(); // userId -> Set(callback)

const notifyCall = (callId) => {
  const data = calls.get(callId);
  const subs = callSubscribers.get(callId);
  if (subs) subs.forEach((cb) => cb(data ? { id: callId, ...data } : null));
};

export const createCall = async (callerId, targetUserId, callType, chatId) => {
  const callId = `${callerId}_${targetUserId}_${Date.now()}`;
  const callData = {
    callerId,
    targetUserId,
    callType,
    chatId,
    status: "ringing",
    createdAt: Date.now(),
    iceCandidates: {},
  };
  calls.set(callId, callData);
  // Notify target user of incoming call
  const subs = incomingSubscribers.get(targetUserId);
  if (subs) subs.forEach((cb) => cb({ id: callId, ...callData }));
  notifyCall(callId);
  return { callId };
};

export const getCall = async (callId) => {
  const data = calls.get(callId);
  return data ? { id: callId, ...data } : null;
};

export const updateCallStatus = async (callId, status) => {
  const data = calls.get(callId);
  if (!data) return;
  data.status = status;
  calls.set(callId, data);
  notifyCall(callId);
};

export const sendOffer = async (callId, offer) => {
  const data = calls.get(callId);
  if (!data) return;
  data.offer = offer;
  calls.set(callId, data);
  notifyCall(callId);
};

export const sendAnswer = async (callId, answer) => {
  const data = calls.get(callId);
  if (!data) return;
  data.answer = answer;
  calls.set(callId, data);
  notifyCall(callId);
};

export const addIceCandidate = async (callId, userId, candidate) => {
  const data = calls.get(callId);
  if (!data) return;
  if (!data.iceCandidates[userId]) data.iceCandidates[userId] = [];
  data.iceCandidates[userId].push(candidate);
  calls.set(callId, data);
  notifyCall(callId);
};

export const subscribeToCall = (callId, callback) => {
  if (!callSubscribers.has(callId)) callSubscribers.set(callId, new Set());
  const set = callSubscribers.get(callId);
  set.add(callback);
  // Emit current value immediately
  const current = calls.get(callId);
  callback(current ? { id: callId, ...current } : null);
  return () => {
    set.delete(callback);
  };
};

export const subscribeIncoming = (targetUserId, callback) => {
  if (!incomingSubscribers.has(targetUserId)) incomingSubscribers.set(targetUserId, new Set());
  const set = incomingSubscribers.get(targetUserId);
  set.add(callback);
  return () => set.delete(callback);
};

export const deleteCall = async (callId) => {
  calls.delete(callId);
  notifyCall(callId);
};
