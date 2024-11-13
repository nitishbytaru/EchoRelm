// echoWhisper.controller.j
import { EchoWhisper } from "../models/echoWhisper.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  const searchedUsers = await User.find({
    username: { $regex: query, $options: "i" },
  })
    .select("-password")
    .limit(5);

  // $regex: query: Uses a regular expression (regex) to search within the username field for a pattern matching the query value. This means it will find usernames that partially match query rather than an exact match.
  // $options: "i": This option makes the regex search case-insensitive (e.g., "Alice" and "alice" would both match the query).

  res.status(203).json({ searchedUsers });
});

export const sendWhisper = asyncHandler(async (req, res) => {
  const { message, receiver } = req.body;
  const sender = req.user;

  if (!message || !receiver) {
    res.status(409).json({ message: "Whisper is required" });
  }

  const { username } = await User.findById(sender).select("username");

  const whisper = await EchoWhisper.create({
    sender,
    message,
    receiver,
    senderUsername: username,
  });

  res.status(200).json({ message: "whisper sent successfully", whisper });
});

export const getWhispers = asyncHandler(async (req, res) => {
  const whispers = await EchoWhisper.find({ receiver: req.user });
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

  res.status(207).json({
    message: `whisper is ${
      updatedWhisper.showOthers ? "pined" : "unpined"
    } successfully`,
    updatedWhisper,
  });
});
