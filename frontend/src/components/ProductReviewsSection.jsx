import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchProductReviewsApi,
  submitProductReviewApi,
  updateProductReviewApi,
  deleteProductReviewApi
} from "../services/reviewApi";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  Sparkles,
  User
} from "lucide-react";

export default function ProductReviewsSection({ productId }) {
  const { user, token, isAuthenticated } = useAuth();
  const location = useLocation();

  const [reviewsData, setReviewsData] = useState({
    total_reviews: 0,
    average_rating: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: []
  });
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProductReviewsApi(productId);
      if (res.success && res.data) {
        setReviewsData(res.data);
      }
    } catch (err) {
      console.error("Load reviews error:", err.message);
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Check if current user has already reviewed
  const userExistingReview = user
    ? reviewsData.reviews.find((r) => r.user_id === user.id)
    : null;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !token) return;

    if (!reviewText.trim() || reviewText.trim().length < 3) {
      setFormError("Please write at least 3 characters in your review comment.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const res = await submitProductReviewApi(token, productId, {
        rating,
        review_title: reviewTitle.trim(),
        review_text: reviewText.trim()
      });

      if (res.success) {
        setSuccessMessage("Thank you! Your review has been submitted.");
        setReviewTitle("");
        setReviewText("");
        setRating(5);
        setShowReviewForm(false);
        await loadReviews();
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (err) {
      setFormError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditTitle(review.review_title || "");
    setEditText(review.review_text || "");
  };

  const handleSaveEdit = async (reviewId) => {
    if (!editText.trim() || editText.trim().length < 3) {
      alert("Review comment must be at least 3 characters.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await updateProductReviewApi(token, reviewId, {
        rating: editRating,
        review_title: editTitle.trim(),
        review_text: editText.trim()
      });

      if (res.success) {
        setEditingId(null);
        await loadReviews();
        setSuccessMessage("Review updated successfully!");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      alert(err.message || "Failed to update review");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete your review?")) {
      try {
        const res = await deleteProductReviewApi(token, reviewId);
        if (res.success) {
          await loadReviews();
          setSuccessMessage("Review deleted successfully.");
          setTimeout(() => setSuccessMessage(""), 4000);
        }
      } catch (err) {
        alert(err.message || "Failed to delete review");
      }
    }
  };

  const totalReviews = reviewsData.total_reviews;
  const averageRating = reviewsData.average_rating;

  return (
    <section id="reviews-section" className="pt-10 border-t border-slate-200 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Customer Ratings & Reviews
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real feedback from verified customers who purchased this item.
          </p>
        </div>

        {isAuthenticated && !userExistingReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            {showReviewForm ? "Cancel Review" : "Write a Review"}
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Aggregates Summary Box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Overall Score */}
        <div className="text-center md:border-r md:border-slate-200 md:pr-8">
          <div className="text-5xl font-black text-slate-900 tracking-tight">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="flex items-center justify-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Based on {totalReviews} {totalReviews === 1 ? "customer review" : "customer reviews"}
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviewsData.breakdown[star] || 0;
            const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-slate-700 flex items-center gap-0.5 justify-end">
                  {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-12 text-slate-400 font-mono text-right">{count} ({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Submission Form (Collapsible or Shown) */}
      {isAuthenticated && showReviewForm && !userExistingReview && (
        <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-indigo-100 shadow-sm animate-fade-in">
          <h3 className="text-base font-bold text-slate-900 mb-1">Write an Honest Review</h3>
          <p className="text-xs text-slate-500 mb-4">Share what you loved or how it could be better.</p>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Interactive Rating Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Overall Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-xs font-bold text-slate-700">
                  {rating === 5 && "Excellent (5/5)"}
                  {rating === 4 && "Good (4/5)"}
                  {rating === 3 && "Average (3/5)"}
                  {rating === 2 && "Poor (2/5)"}
                  {rating === 1 && "Terrible (1/5)"}
                </span>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Headline / Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Excellent build quality, sounds amazing!"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={255}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Review Comment Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Detailed Review *
              </label>
              <textarea
                rows={4}
                required
                placeholder="What did you like or dislike? How does it fit your workflow?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={3000}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 text-right mt-1">
                {reviewText.length} / 3000 characters
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guest Login Prompt Banner */}
      {!isAuthenticated && (
        <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-sm font-bold text-slate-900">Have you purchased this item?</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Sign in to your customer account to share your feedback and ratings.
            </p>
          </div>
          <Link
            to="/login"
            state={{ from: location, message: "Please sign in to write a review." }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            Sign In to Review
          </Link>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs">Loading reviews...</p>
          </div>
        ) : reviewsData.reviews.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-800">No reviews yet</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to share your thoughts on this product!</p>
          </div>
        ) : (
          reviewsData.reviews.map((rev) => {
            const isOwner = user && user.id === rev.user_id;
            const isEditing = editingId === rev.id;

            const reviewDate = new Date(rev.created_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric"
            });

            if (isEditing) {
              return (
                <div
                  key={rev.id}
                  className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Editing Your Review
                    </span>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditRating(s)}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              s <= editRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Comment</label>
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={savingEdit}
                      className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(rev.id)}
                      disabled={savingEdit}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={rev.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header: Stars + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                    {rev.review_title && (
                      <span className="ml-2 text-sm font-bold text-slate-900 line-clamp-1">
                        {rev.review_title}
                      </span>
                    )}
                  </div>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(rev)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Edit your review"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Delete your review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {rev.review_text}
                </p>

                {/* Reviewer Meta */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400 border-t border-slate-100">
                  <div className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rev.reviewer_name}</span>
                  </div>

                  {rev.verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Purchase
                    </span>
                  )}

                  <span>•</span>
                  <span>{reviewDate}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
