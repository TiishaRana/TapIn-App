import { Link } from "react-router-dom";
import { MessageSquareIcon } from "lucide-react";

const FriendCard = ({ friend }) => {
  return (
    <div className="tapin-card">
      <div className="space-y-4">
        {/* USER INFO */}
        <div className="flex items-center gap-4">
          <div className="avatar size-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 flex-shrink-0">
            <img src={friend.profilePic ? friend.profilePic : "/default-avatar.png"} alt={friend.fullName} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="tapin-heading text-lg truncate">{friend.fullName}</h3>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          {friend.skillsOffered && friend.skillsOffered.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-primary">Teaches:</span>
              {friend.skillsOffered.slice(0, 3).map((skill, index) => (
                <span key={index} className="tapin-badge-skill-primary">{skill}</span>
              ))}
              {friend.skillsOffered.length > 3 && (
                <span className="tapin-badge-skill-primary">+{friend.skillsOffered.length - 3}</span>
              )}
            </div>
          )}
          {friend.skillsWanted && friend.skillsWanted.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-secondary">Learns:</span>
              {friend.skillsWanted.slice(0, 3).map((skill, index) => (
                <span key={index} className="tapin-badge-skill-secondary">{skill}</span>
              ))}
              {friend.skillsWanted.length > 3 && (
                <span className="tapin-badge-skill-secondary">+{friend.skillsWanted.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
          <Link to={`/chat/${friend._id}`} className="btn btn-outline btn-primary btn-sm">
            <MessageSquareIcon className="h-4 w-4 mr-2" />
            Chat
          </Link>
        </div>
      </div>
    </div>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}
