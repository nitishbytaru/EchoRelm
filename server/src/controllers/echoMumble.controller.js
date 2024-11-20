// echoMumble.controller.j
import { EchoMumble } from "../models/echoMumble.model.js";
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

export const sendMumble = asyncHandler(async (req, res) => {
  const { message, receiver } = req.body;
  let senderDoc = await User.findById(req.user).select("-password");

  const sender = senderDoc.isAnonymous
    ? { senderId: null, username: "anonymous" }
    : { senderId: req.user, username: senderDoc.username };

  if (!message || !receiver) {
    res.status(409).json({ message: "Mumble is required" });
  }

  const Mumble = await EchoMumble.create({
    sender,
    message,
    receiver,
  });

  res.status(200).json({ message: "Mumble sent successfully", Mumble });
});

export const getMumbles = asyncHandler(async (req, res) => {
  let currUser = await User.findById(req.user).select("-password");

  const Mumbles = await EchoMumble.find({
    receiver: req.user,
    $or: [
      { "sender.senderId": { $nin: [...currUser.blockedUsers, req.user] } },
      { "sender.senderId": null },
    ],
  });

  res.status(200).json({ Mumbles });
});

export const deleteMumble = asyncHandler(async (req, res) => {
  const { MumbleId } = req.query;

  if (!MumbleId) {
    res.status(404).json({ message: "Id is needed to delete the Mumble" });
  }

  const response = await EchoMumble.findByIdAndDelete(MumbleId);

  res.status(207).json({ message: "Mumble is deleted successfully" });
});

export const pinMumble = asyncHandler(async (req, res) => {
  const { MumbleId } = req.query;

  if (!MumbleId) {
    res.status(404).json({ message: "Id is needed to delete the Mumble" });
  }

  // Fetch the current document
  const currentMumble = await EchoMumble.findById(MumbleId);

  // Toggle `showOthers` based on its current value
  const updatedMumble = await EchoMumble.findByIdAndUpdate(
    MumbleId,
    { $set: { pinned: !currentMumble.pinned } }, // Toggle value
    { new: true }
  );

  if (!updatedMumble) {
    return res.status(500).json({ message: "Error updating Mumble" });
  }

  // Increment or decrement numberOfPinnedMumbles based on the new value of `showOthers`
  const incrementValue = updatedMumble.showOthers ? 1 : -1;

  // Fetch user to check current numberOfPinnedMumbles
  const userToCalcu = await User.findById(req.user);

  // Check if incrementing would exceed max value
  if (incrementValue >= 1 && userToCalcu.numberOfPinnedMumbles >= 4) {
    return res
      .status(400)
      .json({ message: "Maximum number of pinned Mumbles reached." });
  }

  // Update the user's numberOfPinnedMumbles
  const updatedUser = await User.findByIdAndUpdate(
    req.user,
    { $inc: { numberOfPinnedMumbles: incrementValue } },
    { new: true }
  );

  if (!updatedUser) {
    return res
      .status(500)
      .json({ message: "Error updating user's pinned Mumbles count" });
  }

  res.status(207).json({
    message: `Mumble is ${
      updatedMumble.showOthers ? "pined" : "unpined"
    } successfully`,
    updatedMumble,
  });
});

export const likeThisMumble = asyncHandler(async (req, res) => {
  const { MumbleId } = req.query;

  if (!MumbleId) {
    res.status(404).json({ message: "Id is needed to like the Mumble" });
  }

  // Fetch the current document
  const currentMumble = await EchoMumble.findById(MumbleId);

  const alreadyLiked = currentMumble?.likes.includes(req.user);

  let updatedMumble = [];

  if (alreadyLiked) {
    updatedMumble = await EchoMumble.findByIdAndUpdate(
      MumbleId,
      {
        $pull: { likes: req.user },
      },
      { new: true }
    );
  } else {
    updatedMumble = await EchoMumble.findByIdAndUpdate(
      MumbleId,
      {
        $push: { likes: req.user },
      },
      { new: true }
    );
  }

  res
    .status(207)
    .json({ message: "updated likes for this Mumble", updatedMumble });
});

export const deleteRecievedMumbles = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "You must login first" });
  }

  const response = await EchoMumble.deleteMany({
    receiver: req.user,
  });
  res.status(207).json({ message: "Deleted all recieved Mumbles" });
});

export const deletesentMumbles = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "You must login first" });
  }

  const response = await EchoMumble.deleteMany({
    sender: req.user,
  });
  res.status(207).json({ message: "Deleted all sent Mumbles" });
});