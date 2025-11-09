"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PropertyListing = {
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
};

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

      await response.json();
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
      toast.error(
        error instanceof Error ? error.message : "Failed to create listing"
      );
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

      const result = await response.json();
      toast.success("Property uploaded to Zyprus successfully!");

      if (typeof window !== "undefined" && result.listingUrl) {
        window.open(result.listingUrl, "_blank");
      }

      // Refresh listings
      await fetchListings();
    } catch (error) {
      console.error("Error uploading listing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload listing"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const fetchListings = useCallback(async () => {
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
  }, []);

  // Fetch listings on component mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-bold text-3xl">Property Management</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Property Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Property</CardTitle>
            <CardDescription>
              Create a new property listing for upload to Zyprus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="name">Property Title</Label>
                <Input
                  id="name"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Modern 2BR Apartment in Limassol"
                  required
                  value={formData.name}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the property features, location, and amenities..."
                  required
                  rows={4}
                  value={formData.description}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="250000"
                    required
                    type="number"
                    value={formData.price}
                  />
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({ ...formData, propertyType: value })
                    }
                    value={formData.propertyType}
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
                    min="0"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfRooms: Number.parseInt(e.target.value, 10) || 0,
                      })
                    }
                    required
                    type="number"
                    value={formData.numberOfRooms}
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfBathroomsTotal: e.target.value,
                      })
                    }
                    placeholder="2"
                    required
                    step="0.5"
                    type="number"
                    value={formData.numberOfBathroomsTotal}
                  />
                </div>

                <div>
                  <Label htmlFor="size">Size (m²)</Label>
                  <Input
                    id="size"
                    onChange={(e) =>
                      setFormData({ ...formData, floorSize: e.target.value })
                    }
                    placeholder="120"
                    required
                    type="number"
                    value={formData.floorSize}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        streetAddress: e.target.value,
                      },
                    })
                  }
                  placeholder="Street Address"
                  value={formData.address.streetAddress}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          addressLocality: e.target.value,
                        },
                      })
                    }
                    placeholder="City/Locality"
                    required
                    value={formData.address.addressLocality}
                  />
                  <Input
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          postalCode: e.target.value,
                        },
                      })
                    }
                    placeholder="Postal Code"
                    value={formData.address.postalCode}
                  />
                </div>
              </div>

              <Button className="w-full" disabled={isLoading} type="submit">
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
              <p className="py-8 text-center text-muted-foreground">
                No listings yet. Create your first property listing!
              </p>
            ) : (
              <div className="space-y-4">
                {listings.map((listing: any) => (
                  <Card key={listing.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{listing.name}</h3>
                          <p className="text-muted-foreground text-sm">
                            {listing.propertyType} • {listing.numberOfRooms} BR
                            • {listing.floorSize}m²
                          </p>
                          <p className="mt-1 font-medium text-sm">
                            €{listing.price}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {listing.address?.addressLocality}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
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
                              disabled={isUploading}
                              onClick={() => handleUpload(listing.id)}
                              size="sm"
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          )}
                          {listing.zyprusListingUrl && (
                            <Button
                              onClick={() =>
                                window.open(listing.zyprusListingUrl, "_blank")
                              }
                              size="sm"
                              variant="outline"
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
