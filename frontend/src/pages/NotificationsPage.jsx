import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, rejectFriendRequest } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { useTranslation } from "react-i18next"; // Import useTranslation

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation(); // Initialize useTranslation

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: rejectRequestMutation, isPending: isRejecting } = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-base-100 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-base-content">{t("notifications")}</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-base-content">
                  <UserCheckIcon className="h-6 w-6 text-primary" />
                  {t("friendRequests")}
                  <span className="badge badge-primary ml-2 text-lg">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-4">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg"
                    >
                      <div className="card-body p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-grow">
                            <div className="avatar w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 flex-shrink-0">
                              <img src={request.sender.profilePic} alt={request.sender.fullName} className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-base-content">{request.sender.fullName}</h3>
                              <div className="flex flex-wrap gap-2 mt-2 text-sm">
                                {request.sender.skillsOffered && request.sender.skillsOffered.length > 0 && (
                                  <span className="badge badge-primary badge-lg font-medium">
                                    {t("canTeach")}: {request.sender.skillsOffered.join(", ")}
                                  </span>
                                )}
                                {request.sender.skillsWanted && request.sender.skillsWanted.length > 0 && (
                                  <span className="badge badge-secondary badge-lg font-medium">
                                    {t("wantsToLearn")}: {request.sender.skillsWanted.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 flex-shrink-0">
                            <button
                              className="btn btn-error btn-outline btn-md px-4 py-2 rounded-lg font-semibold"
                              onClick={() => rejectRequestMutation(request._id)}
                              disabled={isRejecting}
                            >
                              <UserXIcon className="size-5" />
                              {t("reject")}
                            </button>
                            <button
                              className="btn btn-primary btn-md px-4 py-2 rounded-lg font-semibold"
                              onClick={() => acceptRequestMutation(request._id)}
                              disabled={isPending}
                            >
                              {t("accept")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCEPTED REQS NOTIFICATONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-base-content">
                  <BellIcon className="h-6 w-6 text-success" />
                  {t("newConnections")}
                </h2>

                <div className="space-y-4">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-md rounded-lg">
                      <div className="card-body p-6">
                        <div className="flex items-start gap-4">
                          <div className="avatar mt-1 w-12 h-12 rounded-full ring ring-success ring-offset-base-100 ring-offset-2 flex-shrink-0">
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-base-content">{notification.recipient.fullName}</h3>
                            <p className="text-base-content opacity-80 my-2 text-md leading-relaxed">
                              {t("acceptedFriendRequest", { fullName: notification.recipient.fullName })}
                            </p>
                            <p className="text-sm flex items-center opacity-70 text-base-content">
                              <ClockIcon className="h-4 w-4 mr-2" />
                              {t("recently")}
                            </p>
                          </div>
                          <div className="badge badge-success badge-lg font-semibold">
                            <MessageSquareIcon className="h-4 w-4 mr-2" />
                            {t("newFriend")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
