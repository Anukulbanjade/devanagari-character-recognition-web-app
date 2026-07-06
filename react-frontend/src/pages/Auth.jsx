import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signin, signup } from '../utils/api';
import { Toaster, toast } from 'react-hot-toast';

const Auth = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    first_name: "",
    last_name: "",
    date_of_birth: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignup) {
        await signup(form);
        toast.success("Account created!");
        setIsSignup(false);
      } else {
        await signin(form);
        toast.success("Welcome!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4 relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Animated background elements */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/90 backdrop-blur-lg rounded-3xl border border-gray-700/50 shadow-xl overflow-hidden"
        >
          <div className="text-center py-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white"
            >
              {isSignup ? "Create Account" : "Welcome "}
            </motion.h2>
          </div>

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4 p-8"
            onSubmit={handleSubmit}
          >
            <AnimatePresence mode="wait">
              {isSignup && (
                <>
                  <motion.div variants={inputVariants}>
                    <input
                      type="text"
                      placeholder="First Name"
                      name="first_name"
                      onChange={handleChange}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </motion.div>

                  <motion.div variants={inputVariants}>
                    <input
                      type="text"
                      placeholder="Last Name"
                      name="last_name"
                      onChange={handleChange}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </motion.div>

                  <motion.div variants={inputVariants}>
                    <input
                      type="text"
                      placeholder="Username"
                      name="username"
                      onChange={handleChange}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </motion.div>

                  <motion.div variants={inputVariants}>
                    <input
                      type="date"
                      name="date_of_birth"
                      onChange={handleChange}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.div variants={inputVariants}>
              <input
                type="email"
                placeholder="Email"
                name="email"
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </motion.div>

            <motion.div variants={inputVariants}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </motion.div>

            <div className="flex justify-center pt-4">
              <motion.button
                type="submit"
                className="w-48 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-full font-medium shadow-lg shadow-purple-500/30 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  isSignup ? "Sign Up" : "Sign In"
                )}
              </motion.button>
            </div>
          </motion.form>

          <div className="text-center pb-8">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              {isSignup 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;