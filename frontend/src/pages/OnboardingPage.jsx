import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LoaderIcon, MapPinIcon, ShipWheelIcon, ShuffleIcon } from "lucide-react";
const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    skillsOffered: authUser?.skillsOffered || [],
    skillsWanted: authUser?.skillsWanted || [],
    experience: authUser?.experience || "Beginner",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  const [newSkillOffered, setNewSkillOffered] = useState("");
  const [newSkillWanted, setNewSkillWanted] = useState("");

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (updatedUser) => {
      toast.success("Profile onboarded successfully");
      // Persist user locally for our auth stub
      try {
        localStorage.setItem("authUser", JSON.stringify(updatedUser));
      } catch {}
      // Notify the app that auth user has changed to trigger route re-evaluation
      try { window.dispatchEvent(new Event("auth-changed")); } catch {}
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/");
    },

    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; // 1-100 included
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated!");
  };

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !formState.skillsOffered.includes(newSkillOffered.trim())) {
      setFormState({
        ...formState,
        skillsOffered: [...formState.skillsOffered, newSkillOffered.trim()]
      });
      setNewSkillOffered("");
    }
  };

  const addSkillWanted = () => {
    if (newSkillWanted.trim() && !formState.skillsWanted.includes(newSkillWanted.trim())) {
      setFormState({
        ...formState,
        skillsWanted: [...formState.skillsWanted, newSkillWanted.trim()]
      });
      setNewSkillWanted("");
    }
  };

  const removeSkillOffered = (skill) => {
    setFormState({
      ...formState,
      skillsOffered: formState.skillsOffered.filter(s => s !== skill)
    });
  };

  const removeSkillWanted = (skill) => {
    setFormState({
      ...formState,
      skillsWanted: formState.skillsWanted.filter(s => s !== skill)
    });
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Complete Your Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROFILE PIC CONTAINER */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* IMAGE PREVIEW */}
              <div className="size-32 rounded-full bg-base-300 overflow-hidden">
                {formState.profilePic ? (
                  <img
                    src={formState.profilePic}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="size-12 text-base-content opacity-40">📷</div>
                  </div>
                )}
              </div>

              {/* Generate Random Avatar BTN */}
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                  <ShuffleIcon className="size-4 mr-2" />
                  Generate Random Avatar
                </button>
              </div>
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Your full name"
              />
            </div>

            {/* BIO */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself and your skills"
              />
            </div>

            {/* SKILLS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKILLS I CAN TEACH */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Skills I Can Teach</span>
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillOffered}
                      onChange={(e) => setNewSkillOffered(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffered())}
                      className="input input-bordered flex-1"
                      placeholder="e.g., JavaScript, Guitar, Cooking"
                    />
                    <button
                      type="button"
                      onClick={addSkillOffered}
                      className="btn btn-primary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formState.skillsOffered.map((skill, index) => (
                      <div key={index} className="badge badge-primary gap-2">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillOffered(skill)}
                          className="text-xs"
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
                  <span className="label-text">Skills I Want to Learn</span>
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillWanted}
                      onChange={(e) => setNewSkillWanted(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillWanted())}
                      className="input input-bordered flex-1"
                      placeholder="e.g., Python, Photography, Dancing"
                    />
                    <button
                      type="button"
                      onClick={addSkillWanted}
                      className="btn btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formState.skillsWanted.map((skill, index) => (
                      <div key={index} className="badge badge-secondary gap-2">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillWanted(skill)}
                          className="text-xs"
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
                <span className="label-text">Overall Experience Level</span>
              </label>
              <select
                name="experience"
                value={formState.experience}
                onChange={(e) => setFormState({ ...formState, experience: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="Beginner">Beginner - Just starting out</option>
                <option value="Intermediate">Intermediate - Some experience</option>
                <option value="Advanced">Advanced - Quite experienced</option>
                <option value="Expert">Expert - Professional level</option>
              </select>
            </div>

            {/* LOCATION */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}

            <button className="btn btn-primary w-full" disabled={isPending} type="submit">
              {!isPending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Complete Onboarding
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Onboarding...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default OnboardingPage;
