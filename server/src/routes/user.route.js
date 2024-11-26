import { Router } from "express";
import {
  getUsersWithMumbles,
  updateCurrUserData,
  deleteMyAccount,
  searchUsers,
  searchUserById,
  getMostLikedMumbleWithLikesAndFriends,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = Router();

//authentication middleware
router.use(isAuthenticated);
router
  .route("/mumble/:userId/likes-friends")
  .get(getMostLikedMumbleWithLikesAndFriends);
router.route("/search-user/:userId").get(searchUserById);
router.route("/search-by/:username").get(searchUsers);
router.route("/user/:userId/mumbles").get(getUsersWithMumbles);
router.route("/update-user").patch(updateCurrUserData);
router.route("/delete-account").delete(deleteMyAccount);

export default router;
