import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile, getAuthUser } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import PageLoader from "../components/PageLoader.jsx";

// Generate consistent random avatar based on user ID
const getRandomAvatar = (userId) => {
  if (!userId) return `https://avatar.iran.liara.run/public/1.png`;
  
  // Use user ID to generate a consistent number between 1-100
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const avatarIndex = Math.abs(hash % 100) + 1;
  return `https://avatar.iran.liara.run/public/${avatarIndex}.png`;
};

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: authUser, isLoading: isAuthUserLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
  });

  // Use authUser data directly for profile page since we want to edit our own profile
  const userProfile = authUser;

  const [profileData, setProfileData] = useState({
    fullName: userProfile?.fullName || "",
    bio: userProfile?.bio || "",
    skillsOffered: userProfile?.skillsOffered || [],
    skillsWanted: userProfile?.skillsWanted || [],
    experience: userProfile?.experience || "Beginner",
    location: userProfile?.location || "",
    profilePic: userProfile?.profilePic || "",
  });

  const [newSkillOffered, setNewSkillOffered] = useState("");
  const [newSkillWanted, setNewSkillWanted] = useState("");

  // Effect to update form state when userProfile data loads or changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.fullName || "",
        bio: userProfile.bio || "",
        skillsOffered: userProfile.skillsOffered || [],
        skillsWanted: userProfile.skillsWanted || [],
        experience: userProfile.experience || "Beginner",
        location: userProfile.location || "",
        profilePic: userProfile.profilePic || "",
      });
    }
  }, [userProfile]);

  const { mutate: updateProfileMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", authUser?._id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({ ...prevData, [name]: value }));
  };

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !profileData.skillsOffered.includes(newSkillOffered.trim())) {
      setProfileData({
        ...profileData,
        skillsOffered: [...profileData.skillsOffered, newSkillOffered.trim()]
      });
      setNewSkillOffered("");
    }
  };

  const addSkillWanted = () => {
    if (newSkillWanted.trim() && !profileData.skillsWanted.includes(newSkillWanted.trim())) {
      setProfileData({
        ...profileData,
        skillsWanted: [...profileData.skillsWanted, newSkillWanted.trim()]
      });
      setNewSkillWanted("");
    }
  };

  const removeSkillOffered = (skill) => {
    setProfileData({
      ...profileData,
      skillsOffered: profileData.skillsOffered.filter(s => s !== skill)
    });
  };

  const removeSkillWanted = (skill) => {
    setProfileData({
      ...profileData,
      skillsWanted: profileData.skillsWanted.filter(s => s !== skill)
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation(profileData);
  };

  if (isAuthUserLoading) {
    return <PageLoader />;
  }

  if (!authUser || !userProfile) {
    return <div className="flex items-center justify-center min-h-screen text-error font-semibold">{t("profileNotFound")}.</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-base-100 min-h-screen flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto bg-base-200 rounded-2xl shadow-xl p-6 md:p-10 border border-base-300 transform transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-base-content leading-tight">{t("yourProfile")}</h1>

        <div className="flex flex-col items-center mb-8 space-y-4">
          <div className="avatar">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden shadow-lg">
              <img 
                src={profileData.profilePic || userProfile?.profilePic || getRandomAvatar(userProfile?._id)} 
                alt="Profile Picture" 
                className="object-cover w-full h-full" 
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-lg text-base-content">{t("fullName")}</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={profileData.fullName}
              onChange={handleChange}
              placeholder={t("yourFullNamePlaceholder")}
              className="input input-bordered input-lg w-full focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-lg text-base-content">{t("bio")}</span>
            </label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleChange}
              placeholder={t("bioPlaceholder")}
              className="textarea textarea-bordered h-32 w-full focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            ></textarea>
          </div>

          {/* SKILLS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {/* SKILLS I CAN TEACH */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-lg text-base-content">{t("skillsICanTeach")}</span>
              </label>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newSkillOffered}
                    onChange={(e) => setNewSkillOffered(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffered())}
                    className="input input-bordered input-lg flex-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder={t("skillsOfferedPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={addSkillOffered}
                    className="btn btn-primary btn-md px-6 py-2 rounded-lg font-semibold transition-colors duration-200 hover:bg-primary-focus"
                  >
                    {t("add")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {profileData.skillsOffered.map((skill, index) => (
                    <div key={index} className="badge badge-primary badge-lg gap-2 px-5 py-3 text-base font-medium rounded-full shadow-md">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkillOffered(skill)}
                        className="text-xl leading-none align-middle ml-2 focus:outline-none hover:text-base-100/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SKILLS I WANT TO LEARN */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-lg text-base-content">{t("skillsIWantToLearn")}</span>
              </label>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newSkillWanted}
                    onChange={(e) => setNewSkillWanted(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillWanted())}
                    className="input input-bordered input-lg flex-1 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                    placeholder={t("skillsWantedPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={addSkillWanted}
                    className="btn btn-secondary btn-md px-6 py-2 rounded-lg font-semibold transition-colors duration-200 hover:bg-secondary-focus"
                  >
                    {t("add")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {profileData.skillsWanted.map((skill, index) => (
                    <div key={index} className="badge badge-secondary badge-lg gap-2 px-5 py-3 text-base font-medium rounded-full shadow-md">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkillWanted(skill)}
                        className="text-xl leading-none align-middle ml-2 focus:outline-none hover:text-base-100/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* EXPERIENCE LEVEL */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-lg text-base-content">{t("overallExperienceLevel")}</span>
            </label>
            <select
              name="experience"
              value={profileData.experience}
              onChange={handleChange}
              className="select select-bordered select-lg w-full focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            >
              <option value="Beginner">{t("beginner")}</option>
              <option value="Intermediate">{t("intermediate")}</option>
              <option value="Advanced">{t("advanced")}</option>
              <option value="Expert">{t("expert")}</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-lg text-base-content">{t("location")}</span>
            </label>
            <input
              type="text"
              name="location"
              value={profileData.location}
              onChange={handleChange}
              placeholder={t("yourLocationPlaceholder")}
              className="input input-bordered input-lg w-full focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div className="flex justify-center pt-8">
            <button type="submit" className="btn btn-primary btn-xl px-10 py-4 rounded-xl font-bold tracking-wide transition-all duration-200 hover:scale-105" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <span className="loading loading-spinner loading-md"></span>
                  {t("updating")}
                </>
              ) : (
                t("updateProfile")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
