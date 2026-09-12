import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminReviewsApi, updateAdminReviewStatusApi } from "../../services/adminApi";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  Filter
} from "lucide-react";

export default function AdminReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [togglingId, setTogglingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (ratingFilter !== "all") params.rating = ratingFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await fetchAdminReviewsApi(token, params);
      if (res.success) {
        setReviews(res.data || []);
      } else {
        setError(res.message || "Failed to load reviews");
      }
    } catch (err) {
      console.error("Admin load reviews error:", err);
      setError(err.message || "Network error loading reviews");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, ratingFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReviews();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadReviews]);

  const handleToggleStatus = async (review) => {
    try {
      setTogglingId(review.id);
      const newStatus = !review.is_active;
      const res = await updateAdminReviewStatusApi(token, review.id, newStatus);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, is_active: newStatus } : r))
        );
        showToast(
          `Review #${review.id} was successfully ${newStatus ? "activated" : "deactivated"}.`
        );
      }
    } catch (err) {
      showToast(err.message || "Failed to update review status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const totalCount = reviews.length;
  const activeCount = reviews.filter((r) => r.is_active).length;
  const inactiveCount = reviews.filter((r) => !r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm font-medium animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          {toastMessage.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
            Product Reviews Moderation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review customer feedback, inspect submitted ratings, and moderate public visibility.
          </p>
        </div>

        <button
          onClick={loadReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh Reviews
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Reviews</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Active (Visible)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Deactivated (Hidden)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{inactiveCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product, reviewer, or review text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            {[
              { id: "all", label: "All Statuses" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Deactivated" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating filter pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 mr-1">Rating:</span>
          {["all", "5", "4", "3", "2", "1"].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                ratingFilter === r
                  ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {r === "all" ? (
                "All Stars"
              ) : (
                <>
                  <span>{r}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadReviews}
              className="mt-3 px-4 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No reviews found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search criteria, status, or rating filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Reviewer</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Feedback / Content</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {reviews.map((rev) => {
                  const isToggling = togglingId === rev.id;
                  const dateStr = new Date(rev.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/products/${rev.product_slug}`}
                          target="_blank"
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1 line-clamp-1 max-w-[200px]"
                        >
                          <span>{rev.product_name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        </Link>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          ID: #{rev.product_id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rev.reviewer_name || "Customer"}</span>
                        </div>
                        <div className="text-xs text-slate-500">{rev.reviewer_email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-slate-700">
                            {rev.rating}/5
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">{dateStr}</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        {rev.review_title && (
                          <p className="font-semibold text-slate-900 text-xs line-clamp-1">
                            "{rev.review_title}"
                          </p>
                        )}
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                          {rev.review_text}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {rev.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Deactivated
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(rev)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            rev.is_active
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          } disabled:opacity-50`}
                        >
                          {isToggling ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : rev.is_active ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
