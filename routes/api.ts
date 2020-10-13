import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Story, StoryModel } from "../models/story";
import { Card, CardModel } from "../models/card";
import { StoryGraph } from "../services/graph";

// probably should move this to auth
function hasPermission(
	permissionLevel: string,
	user: User,
	story: Story
): boolean {
	// cascade through each of the permission groups
	switch (permissionLevel) {
		case "viewer":
			if (story.viewers !== undefined) {
				for (let i = 0; i < story.viewers.length; i++) {
					if (story.viewers[i]._id == user.id) {
						return true;
					}
				}
			}
		case "editor":
			if (story.editors !== undefined) {
				for (let i = 0; i < story.editors.length; i++) {
					if (story.editors[i]._id == user._id) {
						return true;
					}
				}
			}
		case "author":
			if (story.authors !== undefined) {
				for (let i = 0; i < story.authors.length; i++) {
					if (story.authors[i]._id == user._id) {
						return true;
					}
				}
			}
		case "owner":
			if (story.owner._id == user._id) {
				return true;
			}
		default:
			return false;
	}
}

router.get("/me", (req: any, res) => {
	res.json({
		message: "user profile",
		user: req.user,
		token: req.query.token,
	});
});

router.put("/me", async (req: any, res) => {
	const { email, password, name } = req.body;
	try {
		const salt = randomBytes(32);
		const passwordHashed = await argon2.hash(password, { salt });
		UserModel.findByIdAndUpdate(req.user._id, {
			email: email,
			password: passwordHashed,
			name: name,
		});
		res.json({
			message: "successfully updated account",
			user: req.user,
		});
	} catch (e) {
		console.log(e);
		res.json({
			message: "error changing account details",
			error: e,
		});
	}
});

router.delete("/me", (req: any, res) => {
	UserModel.findByIdAndDelete(req.user._id);
	res.status(201).send({ message: "user deleted" });
});

// we should just abbreviate this call to showing only a few details of each story and a later call to load the actual story
router.get("/stories", async (req, res) => {
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	let user = req.user as User;
	const stories = await StoryModel.find({ owner: user._id });
	return res.status(200).send({ stories: stories });
});

router.post("/story", (req, res) => {
	const { title, description } = req.body;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	let err = StoryGraph.newGraph(req.user as User, title, description);
	if (err) {
		return res.status(200).send({ message: err });
	}
	return res.status(201).send({ message: "success. " + title + " created." });
});

router.delete("/story/:id", async (req, res) => {
	const id = req.params.id;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	if (id !== undefined) {
		await StoryModel.findById(id, (err, story: Story) => {
			let user = req.user as User; // assert User interface
			if (err) {
				console.log(err);
				return res.status(500).json({
					message: "unable to delete story",
					error: err,
				});
			} else if (story === null) {
				return res.json({
					message: "story with id: " + id + " does not exist",
				});
			} else if (story.owner !== user._id) {
				return res.json({
					message: "you don't have permissions to delete this story",
				});
			} else {
				StoryModel.deleteOne(story);
				return res.status(201).send({ message: "story deleted" });
			}
		});
	}
	return res.status(500).send({ message: "no story id provided in params" });
});

router.put("/story/:id", async (req, res) => {
	let { title, description } = req.body;
	StoryModel.findByIdAndUpdate(
		{ id: req.params.id },
		{ title: title, description: description },
		(err, result) => {
			if (err) {
				res.status(500).send({ message: err });
			} else {
				res.status(200).send({ message: result });
			}
		}
	);
});

router.get("/story/:id", async (req, res) => {
	const story = await StoryModel.findById(req.params.id);
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	if (story === null) {
		return res.status(200).send({ message: "story does not exist" });
	}
	if (!hasPermission("viewer", req.user as User, story)) {
		let user = req.user as User;
		console.log("user doesn't have permission: " + user._id);
		return res.status(200).send({ message: "story does not exist" });
	}
	return res.status(200).send({ story: story });
});

// create a card
// router.post("/story/:id/card", async (req, res) => {
// 	console.log("received new card request");
// 	console.log(req.body);
// 	let { text, depth, index, parentIndex } = req.body;
// 	console.log(text);
// 	let story = await StoryModel.findById(req.params.id);
// 	if (story === null) {
// 		return res.status(200).send({ message: "story not found." });
// 	}
// 	if (!hasPermission("author", req.user as User, story)) {
// 		return res.status(200).send({ message: "user does not have permission" });
// 	}
// 	if (depth === undefined || index === undefined) {
// 		return res
// 			.status(200)
// 			.send({ message: "no depth and/or index defined for card" });
// 	}
// 	let user = req.user as User;
// 	let card: Card = new CardModel({
// 		text: text,
// 		depth: depth,
// 		index: index,
// 		owner: user._id,
// 	});
// 	// insert card into story
// 	let err = StoryGraph.insertCard(story, card);
// 	if (err !== "") {
// 		return res.status(201).send({ message: "error: " + err });
// 	}
// 	return res.status(201).send({ message: "success. created card." });
// });

// // delete a card
// router.delete("/story/:id/card", async (req, res) => {
// 	let { text, depth, index, parentIndex } = req.body;
// 	let story = await StoryModel.findById(req.params.id);
// 	if (story === null) {
// 		return res.status(200).send({ message: "story not found." });
// 	}
// 	if (!hasPermission("author", req.user as User, story)) {
// 		return res.status(200).send({ message: "user does not have permission" });
// 	}
// 	await CardModel.findOne({ depth: depth, index: index }, (err, card) => {
// 		if (err || story === null || card === null) {
// 			return res.status(200).send({ message: "card does not exist" });
// 		}

// 		let deletionErr = StoryGraph.deleteCard(story, card);
// 		if (deletionErr !== "") {
// 			return res.status(200).send({ message: deletionErr });
// 		}
// 		console.log("delete card at index " + index);
// 		return res.status(200).send({ message: "successfully deleted card" });
// 	});
// });
// 
// edit a card
// router.put("/story/:id/card", async (req, res) => {
// 	let { text, depth, index, parentIndex } = req.body;
// 	let story = await StoryModel.findById(req.params.id);
// 	if (story === null) {
// 		return res.status(200).send({ message: "story not found." });
// 	}
// 	if (!hasPermission("author", req.user as User, story)) {
// 		return res.status(401).send({ message: "user does not have permission" });
// 	}
// 	await CardModel.findOne({ depth: depth, index: index }, (err, card) => {
// 		if (err || card === null) {
// 			return res.status(200).send({ message: "card does not exist" });
// 		}
// 	});

// 	console.log("edit card at index " + index);
// });

export default router;