import express from "express";
import bodyParser from "body-parser";
import cron from 'node-cron';
import session from "express-session";
import flash from 'express-flash';
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import env from "dotenv";
// import Instamojo from "instamojo-nodejs";

const app = express();
env.config();
const port = process.env.PORT;

// Session and flash setup
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(flash());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Instamojo.setKeys(process.env.INSTAMOJO_API_KEY, process.env.INSTAMOJO_AUTH_TOKEN);
  // Instamojo.isSandboxMode(false); // Enable sandbox mode for testing

// Schedule a check to run every minute to publish scheduled posts

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Sets `user` to null if no session user exists
  next();
});


cron.schedule('* * * * *', async () => {
    console.log("Checking for scheduled posts to publish...");
    const now = new Date();
  
    try {
      const [results] = await db.query(
        "UPDATE blog_posts SET status = 'published' WHERE status = 'scheduled' AND scheduled_at <= ?",
        [now]
      );
  
      if (results.affectedRows > 0) {
        console.log(`Published ${results.affectedRows} post(s).`);
      }
    } catch (error) {
      console.error("Error updating scheduled posts:", error);
    }
  });


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.user = req.session.user || null;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
  });

// Making db available in all routes
app.use((req, res, next) => {
    req.db = db;
    next();
  });


// Home Route
app.get("/", async (req, res) => {
  try {
    // Fetch the first 4 courses from the courses table
    const [courses] = await req.db.query("SELECT * FROM courses LIMIT 4");

    // Fetch the latest 3 blog posts from the blog_posts table
    const [blogPosts] = await req.db.query(
      "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY scheduled_at DESC LIMIT 3"
    );

    // Render the homepage with both courses and blog posts data
    res.render("home", { courses, blogPosts });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error loading homepage");
  }
});

// Login GET Route
app.get("/login", (req, res) => {
    res.render("login.ejs");
  });

// Register GET Route
  app.get("/register", (req, res) => {
    res.render("register.ejs");
  });

// Register Route
app.post("/register", async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      // Default role to 'user'
      await db.query(
        "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, 'user')",
        [email, hashedPassword, first_name, last_name]
      );
      req.flash("success", "Registration successful! Please log in.");
      res.redirect("/login");
    } catch (error) {
      console.error("Registration error:", error);
      req.flash("error", "Email is already in use.");
      res.redirect("/register");
    }
  });
  
  // Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next(); // User is logged in, so continue to the next middleware/route
  } else {
    req.flash("error", "Please log in to proceed with the purchase.");
    res.redirect("/login"); // Redirect to login page if not logged in
  }
}
  
  // Handle User Login Submission
  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const [users] = await req.db.query("SELECT * FROM users WHERE email = ?", [email]);
      const user = users[0];
  
      if (user && (await bcrypt.compare(password, user.password))) {
        req.session.user = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        };
        res.redirect("/courses");
      } else {
        req.flash("error", "Invalid email or password.");
        res.redirect("/login");
      }
    } catch (error) {
      console.error("Login error:", error);
      req.flash("error", "An error occurred. Please try again.");
      res.redirect("/login");
    }
  });
  
  
  // Logout Route
  app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Logout error");
      }
      res.redirect("/");
    });
  });

    // Admin Login Routes
  app.get("/admin-login", (req, res) => {
    res.render("admin-login");
  });
  
  // Handle Admin Login Submission
app.post("/admin-login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      const user = users[0];
  
      // Check if user exists, password matches, and role is 'admin'
      if (user && (await bcrypt.compare(password, user.password)) && user.role === "admin") {
        req.session.user = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        };
        res.redirect("/admin"); // Redirect admin to admin dashboard
      } else {
        req.flash("error", "Invalid admin credentials.");
        res.redirect("/admin-login");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      req.flash("error", "An error occurred. Please try again.");
      res.redirect("/admin-login");
    }
  });
  


    // Admin Middleware
    function isAdmin(req, res, next) {
        if (req.session.user && req.session.user.role === "admin") {
            return next();
        }
        req.flash("error", "Access denied.");
        res.redirect("/login");
    }
    
    
    // Admin Dashboard Route
    app.get("/admin", isAdmin, async (req, res) => {
    try {
        // Fetch all blog posts
        const [blogPosts] = await req.db.query("SELECT * FROM blog_posts ORDER BY scheduled_at DESC");
        res.render("admin-dashboard", { blogPosts });
    } catch (error) {
        console.error("Failed to load admin dashboard:", error);
        res.status(500).send("Error loading admin panel.");
    }
    });

    app.get("/admin/create", isAdmin, (req, res) => {
    res.render("create-post", { tinymceApiKey: process.env.TINYMCE_API_KEY });
    });
    
    // Create Blog Post Route
    app.post("/admin/create", isAdmin, async (req, res) => {
        const { title, content, image_url, author, scheduled_at, status } = req.body;
        try {
          await req.db.query(
            "INSERT INTO blog_posts (title, content, image_url, author, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?)",
            [title, content, image_url, author, scheduled_at, status]
          );
          res.redirect("/admin");
        } catch (error) {
          console.error("Failed to create post:", error);
          res.status(500).send("Error creating post.");
        }
      });
    
    // Edit Blog GET Route
    app.get("/admin/edit/:id", isAdmin, async (req, res) => {
        const postId = req.params.id;
        
        try {
            const [post] = await req.db.query("SELECT * FROM blog_posts WHERE id = ?", [postId]);
            if (post.length > 0) {
            res.render("edit-post", { post: post[0], tinymceApiKey: process.env.TINYMCE_API_KEY });
            } else {
            res.status(404).send("Post not found.");
            }
        } catch (error) {
            console.error("Failed to load post for editing:", error);
            res.status(500).send("Error loading post.");
        }
        });
        
    // Edit Blog POST Route
    app.post("/admin/edit/:id", isAdmin, async (req, res) => {
    const postId = req.params.id;
    const { title, content, image_url, author, scheduled_at, status } = req.body;
    
    try {
        await req.db.query(
        "UPDATE blog_posts SET title = ?, content = ?, image_url = ?, author = ?, scheduled_at = ?, status = ? WHERE id = ?",
        [title, content, image_url, author, scheduled_at, status, postId]
        );
        res.redirect("/admin");
    } catch (error) {
        console.error("Failed to update post:", error);
        res.status(500).send("Error updating post.");
    }
    });
    
    // Delete Blog Post Route
    app.get("/admin/delete/:id", isAdmin, async (req, res) => {
        const postId = req.params.id;
      
        try {
          await req.db.query("DELETE FROM blog_posts WHERE id = ?", [postId]);
          res.redirect("/admin");
        } catch (error) {
          console.error("Failed to delete post:", error);
          res.status(500).send("Error deleting post.");
        }
      });
      
    // Blog Route
  app.get("/blog", async (req, res) => {
    try {
      const [blogPosts] = await req.db.query("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY scheduled_at DESC");
      res.render("blog", { blogPosts });
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      res.status(500).send("Error loading blog posts.");
    }
  });
  


  // Blog post details route
  app.get("/blog/:id", async (req, res) => {
    const postId = req.params.id;
    try {
      const [result] = await req.db.query("SELECT * FROM blog_posts WHERE id = ? AND status = 'published'", [postId]);
      
      if (result.length > 0) {
        res.render("blog-details", { post: result[0] });
      } else {
        res.status(404).send("Blog post not found.");
      }
    } catch (error) {
      console.error("Failed to fetch blog post:", error);
      res.status(500).send("Error loading blog post.");
    }
  });
  
  

// COURSES SECTION

// Function to calculate the discounted price
function calculateDiscountedPrice(course) {
  const discount = (course.original_price * course.discount_percentage) / 100;
  return course.original_price - discount;
}

// Courses Route
app.get("/courses", async (req, res) => {
  try {
    const [courses] = await req.db.query("SELECT * FROM courses");
    
    // Calculate discounted price for each course
    const coursesWithDiscount = courses.map(course => {
      const discountAmount = (course.original_price * course.discount_percentage) / 100;
      const discountedPrice = course.original_price - discountAmount;
      return { ...course, discountedPrice: discountedPrice.toFixed(2) };
    });
    
    res.render("courses", { courses: coursesWithDiscount });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send("Error loading courses.");
  }
});


// Route to handle course selection and redirect to payment page
app.post("/select-course", isAuthenticated, async (req, res) => {
  const courseId = req.body.course_id;
  try {
    const [courseDetails] = await req.db.query("SELECT * FROM courses WHERE id = ?", [courseId]);
    if (courseDetails.length > 0) {
      const course = courseDetails[0];
      const discountAmount = (course.original_price * course.discount_percentage) / 100;
      const discountedPrice = course.original_price - discountAmount;

      req.session.selectedCourse = {
        ...course,
        discountedPrice: discountedPrice.toFixed(2),
      };
      
      res.redirect("/payment");
    } else {
      res.status(404).send("Course not found.");
    }
  } catch (error) {
    console.error("Error selecting course:", error);
    res.status(500).send("Error selecting course.");
  }
});


// Route to render the payment page with selected course details
// Payment Page Route
app.get("/payment", isAuthenticated, (req, res) => {
  if (req.session.selectedCourse) {
    res.render("payment", { course: req.session.selectedCourse });
  } else {
    res.redirect("/courses"); // Redirect back to courses if no course is selected
  }
});

// First verification step route
app.post("/verify", isAuthenticated, (req, res) => {
  if (req.session.selectedCourse) {
    res.render("verify", { course: req.session.selectedCourse });
  } else {
    res.redirect("/courses");
  }
});


// Mock Payment Route (Mimics the payment page)
app.post("/mock-payment", isAuthenticated, (req, res) => {
  if (req.session.selectedCourse) {
    res.render("payment-gateway", { course: req.session.selectedCourse });
  } else {
    res.redirect("/courses");
  }
});

// Payment Success Route (Finalizes mock payment)
app.get("/payment-success", async (req, res) => {
  const course = req.session.selectedCourse;
  const user = req.session.user; // Assuming user details are stored in session

  if (course && user) {
    try {
      // Insert the transaction into the database
      const [result] = await req.db.query(
        "INSERT INTO transactions (user_id, course_id, amount_paid, payment_status) VALUES (?, ?, ?, 'completed')",
        [user.id, course.id, course.discountedPrice]
      );

      // Clear the selected course from the session after purchase
      req.session.selectedCourse = null;

      // Render the payment success page with course details
      res.render("payment-success", { course });
    } catch (error) {
      console.error("Error logging transaction:", error);
      res.status(500).send("Error processing transaction.");
    }
  } else {
    res.redirect("/courses");
  }
});





app.listen(port, () => {
    console.log(`Server is running`);
  });
  