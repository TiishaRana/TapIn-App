import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  searchUsersBySkill, // Add new import
} from "../lib/api";
import { Link } from "react-router-dom"; // Changed to react-router-dom
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon, SearchIcon } from "lucide-react";

import { capitialize } from "../lib/utils";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { useTranslation } from "react-i18next"; // Import useTranslation

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: searchResults = [], isLoading: loadingSearchResults } = useQuery({
    queryKey: ["searchResults", debouncedSearchQuery],
    queryFn: () => searchUsersBySkill(debouncedSearchQuery),
    enabled: !!debouncedSearchQuery, // Only run query if debouncedSearchQuery is not empty
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  const { t } = useTranslation(); // Initialize useTranslation

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-base-100 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-base-300 pb-6 mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-base-content">{t("yourFriends")}</h2>
          <Link to="/notifications" className="btn btn-outline btn-primary btn-sm px-6">
            <UsersIcon className="mr-2 size-4" />
            {t("friendRequests")}
          </Link>
        </div>

        {/* Search Input */}
        <div className="relative mb-10">
          <input
            type="text"
            placeholder={t("searchSkillsPlaceholder")}
            className="input input-bordered w-full pl-12 pr-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-base-content opacity-70" />
        </div>

        {/* Display Search Results */}
        {debouncedSearchQuery && (
          <section className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 text-base-content">{t("searchResults")}</h2>
            {loadingSearchResults ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="card bg-base-200 p-8 text-center shadow-lg rounded-lg">
                <h3 className="font-semibold text-xl mb-3 text-base-content">{t("noUsersFound", { query: debouncedSearchQuery })}</h3>
                <p className="text-base-content opacity-70 text-lg">
                  {t("tryDifferentSkills")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((user) => {
                  const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                  return (
                    <div
                      key={user._id}
                      className="tapin-card"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="avatar size-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 flex-shrink-0">
                            <img src={user.profilePic ? user.profilePic : "/default-avatar.png"} alt={user.fullName} className="object-cover w-full h-full" />
                          </div>

                          <div className="flex-1">
                            <h3 className="tapin-heading text-lg">{user.fullName}</h3>
                            {user.location && (
                              <div className="flex items-center text-sm tapin-subtle mt-1">
                                <MapPinIcon className="size-4 mr-1 text-primary" />
                                {user.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-3">
                          {user.skillsOffered && user.skillsOffered.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium" style={{color:'#38bdf8'}}>{t("canTeach")}:</span>
                              {user.skillsOffered.slice(0, 3).map((skill, index) => (
                                <span key={index} className="tapin-badge-skill-primary">
                                  {capitialize(skill)}
                                </span>
                              ))}
                              {user.skillsOffered.length > 3 && (
                                <span className="tapin-badge-skill-primary">
                                  +{user.skillsOffered.length - 3} {t("more")}
                                </span>
                              )}
                            </div>
                          )}
                          {user.skillsWanted && user.skillsWanted.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium" style={{color:'#a78bfa'}}>{t("wantsToLearn")}:</span>
                              {user.skillsWanted.slice(0, 3).map((skill, index) => (
                                <span key={index} className="tapin-badge-skill-secondary">
                                  {capitialize(skill)}
                                </span>
                              ))}
                              {user.skillsWanted.length > 3 && (
                                <span className="tapin-badge-skill-secondary">
                                  +{user.skillsWanted.length - 3} {t("more")}
                                </span>
                              )}
                            </div>
                          )}
                          {user.experience && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{t("level")}:</span>
                              <span className="tapin-badge-level">{t(user.experience.toLowerCase())}</span>
                            </div>
                          )}
                        </div>

                        {user.bio && <p className="text-sm tapin-subtle leading-relaxed">{user.bio}</p>}

                        {/* Action button */}
                        <button
                          className={`${hasRequestBeenSent ? "tapin-cta-disabled" : "tapin-cta"}`}
                          onClick={() => sendRequestMutation(user._id)}
                          disabled={hasRequestBeenSent || isPending}
                        >
                          {hasRequestBeenSent ? (
                            <>
                              <CheckCircleIcon className="size-4 sm:size-5 mr-1 sm:mr-2" />
                              <span className="truncate">{t("requestSent")}</span>
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="size-4 sm:size-5 mr-1 sm:mr-2" />
                              <span className="truncate">{t("sendFriendRequest")}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Existing Recommended Users section - only show if no search query */}
        {!debouncedSearchQuery && (
          <section>
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-base-300 pb-6 mb-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-base-content">{t("discoverSkillPartners")}</h2>
                  <p className="opacity-70 text-lg text-base-content">
                    {t("findPeopleToExchangeSkills")}
                  </p>
                </div>
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : recommendedUsers.length === 0 ? (
              <div className="card bg-base-200 p-8 text-center shadow-lg rounded-lg">
                <h3 className="font-semibold text-xl mb-3 text-base-content">{t("noRecommendationsAvailable")}</h3>
                <p className="text-base-content opacity-70 text-lg">
                  {t("checkBackLaterForPartners")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendedUsers.map((user) => {
                  const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                  return (
                    <div
                      key={user._id}
                      className="tapin-card"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="avatar size-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 flex-shrink-0">
                            <img src={user.profilePic} alt={user.fullName} className="object-cover w-full h-full" />
                          </div>

                          <div className="flex-1">
                            <h3 className="tapin-heading text-lg">{user.fullName}</h3>
                            {user.location && (
                              <div className="flex items-center text-sm tapin-subtle mt-1">
                                <MapPinIcon className="size-4 mr-1 text-primary" />
                                {user.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-3">
                          {user.skillsOffered && user.skillsOffered.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium" style={{color:'#38bdf8'}}>{t("canTeach")}:</span>
                              {user.skillsOffered.slice(0, 3).map((skill, index) => (
                                <span key={index} className="tapin-badge-skill-primary">
                                  {capitialize(skill)}
                                </span>
                              ))}
                              {user.skillsOffered.length > 3 && (
                                <span className="tapin-badge-skill-primary">
                                  +{user.skillsOffered.length - 3} {t("more")}
                                </span>
                              )}
                            </div>
                          )}
                          {user.skillsWanted && user.skillsWanted.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium" style={{color:'#a78bfa'}}>{t("wantsToLearn")}:</span>
                              {user.skillsWanted.slice(0, 3).map((skill, index) => (
                                <span key={index} className="tapin-badge-skill-secondary">
                                  {capitialize(skill)}
                                </span>
                              ))}
                              {user.skillsWanted.length > 3 && (
                                <span className="tapin-badge-skill-secondary">
                                  +{user.skillsWanted.length - 3} {t("more")}
                                </span>
                              )}
                            </div>
                          )}
                          {user.experience && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{t("level")}:</span>
                              <span className="tapin-badge-level">{t(user.experience.toLowerCase())}</span>
                            </div>
                          )}
                        </div>

                        {user.bio && <p className="text-sm tapin-subtle leading-relaxed">{user.bio}</p>}

                        {/* Action button */}
                        <button
                          className={`${hasRequestBeenSent ? "tapin-cta-disabled" : "tapin-cta"}`}
                          onClick={() => sendRequestMutation(user._id)}
                          disabled={hasRequestBeenSent || isPending}
                        >
                          {hasRequestBeenSent ? (
                            <>
                              <CheckCircleIcon className="size-4 sm:size-5 mr-1 sm:mr-2" />
                              <span className="truncate">{t("requestSent")}</span>
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="size-4 sm:size-5 mr-1 sm:mr-2" />
                              <span className="truncate">{t("sendFriendRequest")}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;
