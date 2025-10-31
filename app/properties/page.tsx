"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PropertyListing {
  id?: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  numberOfRooms: number;
  numberOfBathroomsTotal: string;
  floorSize: string;
  propertyType: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
  };
}

export default function PropertiesPage() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<PropertyListing>({
    name: "",
    description: "",
    price: "",
    currency: "EUR",
    numberOfRooms: 0,
    numberOfBathroomsTotal: "",
    floorSize: "",
    propertyType: "apartment",
    address: {
      streetAddress: "",
      addressLocality: "",
      postalCode: "",
    },
  });

  const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "house", label: "House" },
    { value: "townhouse", label: "Townhouse" },
    { value: "penthouse", label: "Penthouse" },
    { value: "bungalow", label: "Bungalow" },
    { value: "land", label: "Land" },
    { value: "commercial", label: "Commercial" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/listings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          numberOfRooms: Number(formData.numberOfRooms),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create listing");
      }

      const data = await response.json();
      toast.success("Property listing created successfully!");

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        currency: "EUR",
        numberOfRooms: 0,
        numberOfBathroomsTotal: "",
        floorSize: "",
        propertyType: "apartment",
        address: {
          streetAddress: "",
          addressLocality: "",
          postalCode: "",
        },
      });

      // Refresh listings
      await fetchListings();
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create listing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (listingId: string) => {
    setIsUploading(true);

    try {
      const response = await fetch("/api/listings/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listingId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload listing");
      }

      const data = await response.json();
      toast.success("Property uploaded to Zyprus successfully!");

      if (data.listingUrl) {
        window.open(data.listingUrl, "_blank");
      }

      // Refresh listings
      await fetchListings();
    } catch (error) {
      console.error("Error uploading listing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload listing");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/listings/list");
      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      if (typeof window !== "undefined") {
        toast.error("Failed to fetch listings");
      }
    }
  };

  // Fetch listings on component mount
  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Property Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Property</CardTitle>
            <CardDescription>
              Create a new property listing for upload to Zyprus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Property Title</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Modern 2BR Apartment in Limassol"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the property features, location, and amenities..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="250000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, propertyType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.numberOfRooms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfRooms: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.numberOfBathroomsTotal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfBathroomsTotal: e.target.value,
                      })
                    }
                    placeholder="2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="size">Size (m²)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={formData.floorSize}
                    onChange={(e) =>
                      setFormData({ ...formData, floorSize: e.target.value })
                    }
                    placeholder="120"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Street Address"
                  value={formData.address.streetAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        streetAddress: e.target.value,
                      },
                    })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="City/Locality"
                    value={formData.address.addressLocality}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          addressLocality: e.target.value,
                        },
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="Postal Code"
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          postalCode: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Listing"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Listings List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Property Listings</CardTitle>
            <CardDescription>
              Manage and upload your property listings to Zyprus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No listings yet. Create your first property listing!
              </p>
            ) : (
              <div className="space-y-4">
                {listings.map((listing: any) => (
                  <Card key={listing.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{listing.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {listing.propertyType} • {listing.numberOfRooms} BR •{" "}
                            {listing.floorSize}m²
                          </p>
                          <p className="text-sm font-medium mt-1">
                            €{listing.price}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {listing.address?.addressLocality}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                listing.status === "uploaded"
                                  ? "bg-green-100 text-green-700"
                                  : listing.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {listing.status}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {listing.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpload(listing.id)}
                              disabled={isUploading}
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          )}
                          {listing.zyprusListingUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(listing.zyprusListingUrl, "_blank")
                              }
                            >
                              View on Zyprus
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}