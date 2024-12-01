import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import MessageBar from "../../ui/MessageBar";
import { setIsLoading } from "../../../app/slices/authSlice.js";
import {
  MoreVertSharpIcon,
  ArrowBackIosIcon,
} from "../../../heplerFunc/exportIcons.js";
import {
  clearChatApi,
  deleteChatRoomApi,
  sendEchoLinkMessageApi,
} from "../../../api/echoLink.api.js";
import {
  addPrivateMessage,
  addToMyPrivateChatRooms,
  removeFromMyPrivateChatRooms,
  setLatestMessageAsRead,
  setPrivateMessages,
} from "../../../app/slices/echoLinkSlice.js";
import socket from "../../../sockets/socket.js";
import { useAutoScroll } from "../../../hooks/useAutoScroll.js";
import toast from "react-hot-toast";
import { handleRemoveOrBlockMyFriendApi } from "../../../api/friends.api.js";
import {
  createUniquechatRoom,
  markAsRead,
} from "../../../heplerFunc/microFuncs.js";
import { Link, useParams } from "react-router-dom";
import { searchUserByIdApi } from "../../../api/user.api.js";

function ChatBox() {
  const dispatch = useDispatch();
  const { recieverId } = useParams();

  const { user } = useSelector((state) => state.auth);
  const { privateMessages } = useSelector((state) => state.echoLink);

  const messagesEndRef = useAutoScroll(privateMessages);

  const [echoLinkMessageData, setEchoLinkMessageData] = useState(null);
  const [selectedUser, setSelecedUser] = useState(null);
  const uniqueChatRoom = createUniquechatRoom(user?._id, recieverId);

  useEffect(() => {
    const getRecieverDataByIdFunc = async () => {
      const response = await searchUserByIdApi(recieverId);
      setSelecedUser(response?.data?.searchedUser);
    };

    if (recieverId) {
      getRecieverDataByIdFunc();
    }
  }, [recieverId]);

  useEffect(() => {
    socket.on("send_latest_echoLink_message", (latestEchoLinkMessage) => {
      if (recieverId === latestEchoLinkMessage?.latestMessage?.sender) {
        markAsRead(dispatch, setLatestMessageAsRead, latestEchoLinkMessage);
      }
      dispatch(addToMyPrivateChatRooms(latestEchoLinkMessage));
      dispatch(addPrivateMessage(latestEchoLinkMessage.latestMessage));
    });

    return () => {
      socket.off("send_latest_echoLink_message");
    };
  }, [dispatch, recieverId, user._id]);

  useEffect(() => {
    if (echoLinkMessageData && !echoLinkMessageData.has("receiver")) {
      echoLinkMessageData.append("receiver", recieverId);
    }

    const sendMessage = async () => {
      try {
        if (echoLinkMessageData) {
          const response = await sendEchoLinkMessageApi(echoLinkMessageData);
          dispatch(
            addPrivateMessage(response?.data?.receiverData?.latestMessage)
          );
          dispatch(addToMyPrivateChatRooms(response?.data?.receiverData));
        }
      } catch (error) {
        console.log(error);
      } finally {
        setEchoLinkMessageData(null);
      }
    };

    sendMessage();
  }, [dispatch, echoLinkMessageData, recieverId]);

  const blockSender = async () => {
    const senderId = recieverId;

    dispatch(setIsLoading(true));
    const response = await handleRemoveOrBlockMyFriendApi({
      senderId,
      block: true,
    });

    dispatch(setIsLoading(false));
    dispatch(removeFromMyPrivateChatRooms(uniqueChatRoom));
    if (response?.data) {
      toast.success(response.data?.message);
    }
  };

  const clearChat = async () => {
    dispatch(setIsLoading(true));
    const response = await clearChatApi(uniqueChatRoom);
    dispatch(setIsLoading(false));
    dispatch(setPrivateMessages([]));
    toast.success(response?.data?.message);
  };

  const deleteChatRoom = async () => {
    dispatch(setIsLoading(true));
    const response = await deleteChatRoomApi(uniqueChatRoom);
    dispatch(setIsLoading(false));
    toast.success(response?.data?.message);
    dispatch(removeFromMyPrivateChatRooms(uniqueChatRoom));
  };

  return (
    <>
      {!recieverId ? (
        <div className="h-full flex justify-center items-center text-center bg-base-100 rounded-xl">
          <p className="text-xl font-semibold text-gray-600">
            Select a user to open chat
          </p>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Navbar with dropdown menu */}
          <div className="navbar bg-base-100 rounded-xl flex-none">
            <div className="flex-1">
              <div className="avatar flex items-center">
                {/* Back Button */}
                <Link to={"/"} className="p-0 sm:hidden btn btn-sm z-10">
                  <ArrowBackIosIcon />
                </Link>
                <div className="w-10 rounded-full">
                  <img src={selectedUser?.avatar?.url} alt="User avatar" />
                </div>
                <p className="ml-2 flex items-center">
                  {selectedUser?.username}
                </p>
              </div>
            </div>
            <div className="flex-none">
              <div className="dropdown dropdown-end">
                <div
                  role="button"
                  tabIndex={0}
                  className="btn btn-sm bg-base-100 rounded-full"
                >
                  <MoreVertSharpIcon />
                </div>
                <ul
                  tabIndex={0}
                  className="menu dropdown-content bg-base-200 rounded-box z-[1] p-2 w-56 shadow mt-2"
                >
                  <li>
                    <button className="btn" onClick={clearChat}>
                      Clear chat
                    </button>
                  </li>
                  <li>
                    <button className="btn" onClick={deleteChatRoom}>
                      Delete ChatRoom
                    </button>
                  </li>
                  <li className="bg-error">
                    <button className="btn btn-error" onClick={blockSender}>
                      Block User
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto bg-base-100 mt-2 p-2 rounded-xl">
            <div className="h-full">
              <div className="flex-1 overflow-y-auto">
                {privateMessages?.map((messages, index) => (
                  <div
                    key={index}
                    className={`chat ${
                      messages?.sender !== user?._id ? "chat-start" : "chat-end"
                    }`}
                  >
                    <div className="chat-bubble ">
                      {messages?.attachments?.url ? null : (
                        <img
                          src={messages?.attachments[0]?.url}
                          alt=""
                          className={`${
                            messages?.attachments[0]?.url
                              ? "w-72 h-40 object-cover rounded-lg mb-2"
                              : ""
                          }`}
                        />
                      )}
                      {messages?.message}
                    </div>
                    <div className="chat-footer opacity-50 mt-1">
                      <time className="text-xs opacity-50">
                        {moment(messages?.createdAt).fromNow()}
                      </time>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} /> {/* Reference for auto-scroll */}
              </div>
            </div>
          </div>

          {/* Message bar at the bottom */}
          <MessageBar setMessageData={setEchoLinkMessageData} />
        </div>
      )}
    </>
  );
}

export default ChatBox;
