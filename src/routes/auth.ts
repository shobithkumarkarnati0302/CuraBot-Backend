import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";
import { auth, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// Register a new user
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role")
      .isIn(["patient", "doctor"])
      .withMessage("Invalid role"),
  ],
  async (req: Request, res: Response) => {
    try {
      console.log("Registration attempt:", { body: req.body });
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role } = req.body;
      console.log("Creating user with data:", { name, email, role });

      // Block admin registration
      if (role === 'admin') {
        return res.status(403).json({ error: "Admin registration is not allowed" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("User already exists:", email);
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create new user
      console.log("Creating new user instance...");
      const user = new User({ name, email, password, role });
      
      console.log("Saving user to database...");
      const savedUser = await user.save();
      console.log("User saved successfully:", savedUser._id);

      // Generate token
      const token = (savedUser as any).generateAuthToken();
      console.log("Token generated successfully");

      // Remove password before sending to frontend
      const { password: pwd, ...userData } = savedUser.toObject();
      console.log("Sending response with user data");
      res.status(201).json({ user: userData, token });
    } catch (error: any) {
      console.error("Registration error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      if (error.name === "ValidationError") {
        console.log("Mongoose validation error:", error.errors);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: Object.keys(error.errors).map(key => ({
            field: key,
            message: error.errors[key].message
          }))
        });
      }
      
      if (error.code === 11000) {
        console.log("Duplicate key error:", error.keyPattern);
        return res.status(400).json({ error: "Email already registered" });
      }
      
      res.status(500).json({ error: "Error creating user: " + error.message });
    }
  }
);

// Login user
// router.post(
//   "/login",
//   [
//     body("email").isEmail().withMessage("Please enter a valid email"),
//     body("password").exists().withMessage("Password is required"),
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const { email, password } = req.body;
//       const user = await User.findByCredentials(email, password);
//       const token = user.generateAuthToken();

//       res.json({ user, token });
//     } catch (error) {
//       res.status(401).json({ error: "Invalid login credentials" });
//     }
//   }
// );


//2 login modified
// Login user
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await (User as any).findByCredentials(email, password);
      const token = (user as any).generateAuthToken();

      res.json({ user, token });
    } catch (error) {
      res.status(401).json({ error: "Invalid login credentials" });
    }
  }
);


// Get current user
// router.get('/me', auth, async (req, res) => {
//   try {
//     res.json(req.user);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching user data' });
//   }
// });

// Get current user
// router.get("/me", auth, async (req, res) => {
//   try {
//     if (!req.user) return res.status(404).json({ error: "User not found" });

//     const { password, ...userData } = req.user.toObject(); // remove password
//     res.json(userData);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching user data" });
//   }
// });

//modified 
router.get("/me", auth, async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ error: "User not found" });

    // Rename password to pwd to avoid redeclaration
    const { password: pwd, ...userData } = (req.user as any).toObject();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user data" });
  }
});


export default router;
