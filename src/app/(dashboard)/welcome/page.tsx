"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type FullProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  acceptanceStatus: string;
  profilePic: string | null;
  level: string | null;
  bio: string | null;
  createdAt: string;
  phoneNumber: string | null;
  city: string | null;
  state: string | null;
  schoolName: string | null;
  major: string | null;
  degreeLevel: string | null;
  graduationYear: string | null;
  schoolYear: string | null;
  personalEmail: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const StatusBadge = ({ status }: { status: string }) => {
  const style = STATUS_STYLES[status?.toLowerCase()] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${style} capitalize`}>
      {status ?? "pending"}
    </span>
  );
};

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
};

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    authFetch("/api/auth/me")
      .then((data) => setProfile(data.user))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user]);

  if (!user) return null;

  const displayName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header card */}
        <div className="bg-[#001049] rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-2xl font-bold shrink-0 overflow-hidden">
            {profile?.profilePic
              ? <img src={profile.profilePic} alt={displayName} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-blue-200 text-sm mt-1">{user.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 justify-center sm:justify-start">
              <StatusBadge status={user.acceptanceStatus} />
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full capitalize">{user.role}</span>
              {profile?.level && (
                <span className="text-xs bg-[#FFCA3A]/20 text-[#FFCA3A] px-3 py-1 rounded-full">
                  Level {profile.level}
                </span>
              )}
            </div>
            {profile?.bio && (
              <p className="text-blue-100 text-sm mt-3 max-w-lg">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Membership status notice */}
        {user.acceptanceStatus?.toLowerCase() === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-yellow-500 text-xl">⏳</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Membership application pending</p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Your application is under review. You'll be notified once an admin approves your membership.
              </p>
            </div>
          </div>
        )}
        {user.acceptanceStatus?.toLowerCase() === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <p className="text-sm font-semibold text-green-800">You're an official AMSA member!</p>
              {joinedDate && (
                <p className="text-sm text-green-700 mt-0.5">Member since {joinedDate}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#001049] mb-4">Personal Info</h2>
            {loadingProfile ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}
              </div>
            ) : (
              <div>
                <InfoRow label="Phone" value={profile?.phoneNumber} />
                <InfoRow label="Personal email" value={profile?.personalEmail} />
                <InfoRow label="City" value={profile?.city} />
                <InfoRow label="State" value={profile?.state} />
                {!profile?.phoneNumber && !profile?.city && (
                  <p className="text-sm text-gray-400">No personal info on file.</p>
                )}
              </div>
            )}
          </div>

          {/* School info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#001049] mb-4">School Info</h2>
            {loadingProfile ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}
              </div>
            ) : (
              <div>
                <InfoRow label="School" value={profile?.schoolName} />
                <InfoRow label="Degree" value={profile?.degreeLevel} />
                <InfoRow label="Major" value={profile?.major} />
                <InfoRow label="School year" value={profile?.schoolYear} />
                <InfoRow label="Graduation year" value={profile?.graduationYear} />
                {!profile?.schoolName && (
                  <p className="text-sm text-gray-400">No school info on file.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Social links */}
        {(profile?.facebook || profile?.instagram || profile?.linkedin) && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#001049] mb-4">Social Links</h2>
            <div className="flex flex-wrap gap-3">
              {profile?.facebook && (
                <a href={profile.facebook} target="_blank" rel="noreferrer"
                  className="text-sm px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition">
                  Facebook
                </a>
              )}
              {profile?.instagram && (
                <a href={profile.instagram} target="_blank" rel="noreferrer"
                  className="text-sm px-4 py-2 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 transition">
                  Instagram
                </a>
              )}
              {profile?.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                  className="text-sm px-4 py-2 rounded-lg border border-blue-300 text-blue-800 hover:bg-blue-50 transition">
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
