// echoWhisper.controller.j
import { EchoWhisper } from "../models/echoWhisper.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  const currUser = await User.findById(req.user).select("-password");

  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  let searchedUsers = await User.find({
    username: { $regex: query, $options: "i" },
    _id: { $nin: [...currUser.blockedUsers, req.user] },
    // $regex: query: Uses a regular expression (regex) to search within the username field for a pattern matching the query value. This means it will find usernames that partially match query rather than an exact match.
    // $options: "i": This option makes the regex search case-insensitive (e.g., "Alice" and "alice" would both match the query).
  })
    .select("-password")
    .limit(5);

  res.status(203).json({ searchedUsers });
});

export const sendWhisper = asyncHandler(async (req, res) => {
  const { message, receiver } = req.body;
  let senderDoc = await User.findById(req.user).select("-password");

  const sender = senderDoc.isAnonymous
    ? { senderId: null, username: "anonymous" }
    : { senderId: req.user, username: senderDoc.username };

  if (!message || !receiver) {
    res.status(409).json({ message: "Whisper is required" });
  }

  const whisper = await EchoWhisper.create({
    sender,
    message,
    receiver,
  });

  res.status(200).json({ message: "whisper sent successfully", whisper });
});

export const getWhispers = asyncHandler(async (req, res) => {
  let currUser = await User.findById(req.user).select("-password");

  const whispers = await EchoWhisper.find({
    receiver: req.user,
    $or: [
      { "sender.senderId": { $nin: [...currUser.blockedUsers, req.user] } },
      { "sender.senderId": null },
    ],
  });

  res.status(200).json({ whispers });
});

export const deleteWhisper = asyncHandler(async (req, res) => {
  const { whisperId } = req.query;

  if (!whisperId) {
    res.status(404).json({ message: "Id is needed to delete the whisper" });
  }

  const response = await EchoWhisper.findByIdAndDelete(whisperId);

  res.status(207).json({ message: "whisper is deleted successfully" });
});

export const pinWhisper = asyncHandler(async (req, res) => {
  const { whisperId } = req.query;

  if (!whisperId) {
    res.status(404).json({ message: "Id is needed to delete the whisper" });
  }

  // Fetch the current document
  const currentWhisper = await EchoWhisper.findById(whisperId);

  // Toggle `showOthers` based on its current value
  const updatedWhisper = await EchoWhisper.findByIdAndUpdate(
    whisperId,
    { $set: { showOthers: !currentWhisper.showOthers } }, // Toggle value
    { new: true }
  );

  if (!updatedWhisper) {
    return res.status(500).json({ message: "Error updating whisper" });
  }

  // Increment or decrement numberOfPinnedWhispers based on the new value of `showOthers`
  const incrementValue = updatedWhisper.showOthers ? 1 : -1;

  // Fetch user to check current numberOfPinnedWhispers
  const userToCalcu = await User.findById(req.user);

  // Check if incrementing would exceed max value
  if (incrementValue >= 1 && userToCalcu.numberOfPinnedWhispers >= 4) {
    return res
      .status(400)
      .json({ message: "Maximum number of pinned whispers reached." });
  }

  // Update the user's numberOfPinnedWhispers
  const updatedUser = await User.findByIdAndUpdate(
    req.user,
    { $inc: { numberOfPinnedWhispers: incrementValue } },
    { new: true }
  );

  if (!updatedUser) {
    return res
      .status(500)
      .json({ message: "Error updating user's pinned whispers count" });
  }

  res.status(207).json({
    message: `whisper is ${
      updatedWhisper.showOthers ? "pined" : "unpined"
    } successfully`,
    updatedWhisper,
  });
});

export const likeThisWhisper = asyncHandler(async (req, res) => {
  const { whisperId } = req.query;

  if (!whisperId) {
    res.status(404).json({ message: "Id is needed to like the whisper" });
  }

  // Fetch the current document
  const currentWhisper = await EchoWhisper.findById(whisperId);

  const alreadyLiked = currentWhisper?.likes.includes(req.user);

  let updatedWhisper = [];

  if (alreadyLiked) {
    updatedWhisper = await EchoWhisper.findByIdAndUpdate(
      whisperId,
      {
        $pull: { likes: req.user },
      },
      { new: true }
    );
  } else {
    updatedWhisper = await EchoWhisper.findByIdAndUpdate(
      whisperId,
      {
        $push: { likes: req.user },
      },
      { new: true }
    );
  }

  res
    .status(207)
    .json({ message: "updated likes for this whisper", updatedWhisper });
});

export const deleteRecievedWhispers = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "You must login first" });
  }

  const response = await EchoWhisper.deleteMany({
    receiver: req.user,
  });
  res.status(207).json({ message: "Deleted all recieved Whispers" });
});

export const deletesentWhispers = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "You must login first" });
  }

  const response = await EchoWhisper.deleteMany({
    sender: req.user,
  });
  res.status(207).json({ message: "Deleted all sent Whispers" });
});
