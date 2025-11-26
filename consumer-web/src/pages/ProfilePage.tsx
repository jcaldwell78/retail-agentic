import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleProfileSave = () => {
    // TODO: Call API to update profile
    console.log('Saving profile:', profile);
    setIsEditing(false);
  };

  const handleAddAddress = () => {
    setShowAddressForm(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Profile Information */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              data-testid="edit-profile-button"
            >
              Edit Profile
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            {isEditing ? (
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                data-testid="profile-name-input"
              />
            ) : (
              <p className="text-gray-900" data-testid="profile-name-display">
                {profile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <p className="text-gray-900" data-testid="profile-email-display">
              {profile.email}
            </p>
            <p className="text-sm text-gray-500">
              Contact support to change your email address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            {isEditing ? (
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                data-testid="profile-phone-input"
              />
            ) : (
              <p className="text-gray-900" data-testid="profile-phone-display">
                {profile.phone || 'Not provided'}
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-6">
            <Button onClick={handleProfileSave} data-testid="save-profile-button">
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              data-testid="cancel-profile-button"
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>

      {/* Address Book */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Address Book</h2>
          <Button
            variant="outline"
            onClick={handleAddAddress}
            data-testid="add-address-button"
          >
            Add Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No addresses saved
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Add a shipping address to make checkout faster
            </p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="address-list">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  {address.isDefault && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2">
                      Default
                    </span>
                  )}
                  <p className="font-medium">{address.line1}</p>
                  {address.line2 && <p className="text-gray-600">{address.line2}</p>}
                  <p className="text-gray-600">
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p className="text-gray-600">{address.country}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Password Change */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-6">Security</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Password</p>
            <p className="text-sm text-gray-500">
              Last changed 30 days ago
            </p>
          </div>
          <Button variant="outline" data-testid="change-password-button">
            Change Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
