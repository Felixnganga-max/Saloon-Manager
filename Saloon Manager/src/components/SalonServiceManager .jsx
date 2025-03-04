import { useState, useEffect } from "react";
import axios from "axios";

const ServicesManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    duration: "",
    description: "",
    images: [],
    popular: false,
    discount: "",
    tags: "",
  });
  const [viewingServices, setViewingServices] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState(null);
  const [tempImages, setTempImages] = useState([]);

  const API_URL = "https://saloon-e7dp.vercel.app/api/services";

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setServices(response.data);
    } catch (err) {
      setError("Error fetching services");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      images: [...formData.images, ...Array.from(e.target.files)],
    });
  };

  const handleRemoveImage = (index) => {
    if (isEditing && typeof formData.images[index] === "string") {
      // Store the URL to be removed on server side
      setTempImages([...tempImages, formData.images[index]]);
    }

    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({
      ...formData,
      images: updatedImages,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      price: "",
      duration: "",
      description: "",
      images: [],
      popular: false,
      discount: "",
      tags: "",
    });
    setIsEditing(false);
    setCurrentServiceId(null);
    setTempImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add all form fields except images
      Object.keys(formData).forEach((key) => {
        if (key !== "images") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add images that are files (new uploads)
      formData.images.forEach((image) => {
        if (typeof image !== "string") {
          formDataToSend.append("images", image);
        }
      });

      // Add existing image URLs
      const existingImageUrls = formData.images
        .filter((img) => typeof img === "string")
        .map((url) => url);
      formDataToSend.append(
        "existingImages",
        JSON.stringify(existingImageUrls)
      );

      // Add images to remove (for editing)
      if (tempImages.length > 0) {
        formDataToSend.append("imagesToRemove", JSON.stringify(tempImages));
      }

      if (isEditing) {
        await axios.patch(`${API_URL}/${currentServiceId}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(API_URL, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchServices();
      resetForm();
      setViewingServices(true);
    } catch (err) {
      setError(`Error ${isEditing ? "updating" : "adding"} service`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchServices();
      } catch (err) {
        setError("Error deleting service");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name,
      category: service.category,
      price: service.price,
      duration: service.duration,
      description: service.description,
      images: service.images || [],
      popular: service.popular || false,
      discount: service.discount || "",
      tags: service.tags ? service.tags.join(", ") : "",
    });
    setCurrentServiceId(service._id);
    setIsEditing(true);
    setViewingServices(false);
  };

  const handleCancel = () => {
    resetForm();
    setViewingServices(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Service Manager
      </h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => {
            resetForm();
            setViewingServices(false);
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex-1 transition duration-200"
        >
          Create New Service
        </button>
        <button
          onClick={() => {
            resetForm();
            setViewingServices(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex-1 transition duration-200"
        >
          View Services
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!viewingServices ? (
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {isEditing ? "Edit Service" : "Create New Service"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Service Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Service Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="hair">Hair</option>
                  <option value="dreadlocks">Dreadlocks</option>
                  <option value="nails">Nails</option>
                  <option value="facial">Facial</option>
                  <option value="massage">Braids</option>
                  <option value="makeup">Makeup</option>
                  <option value="barber">Barber</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Price (Ksh.)</label>
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  placeholder="Duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  placeholder="Discount percentage"
                  value={formData.discount}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  placeholder="e.g. premium, quick, special"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-24"
                required
              ></textarea>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="popular"
                checked={formData.popular}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-gray-700">
                Popular Service
              </label>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Images</label>
              <input
                type="file"
                name="images"
                onChange={handleImageChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                multiple
                accept="image/*"
              />

              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={
                          typeof image === "string"
                            ? image
                            : URL.createObjectURL(image)
                        }
                        alt={`Service preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 focus:outline-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex-1 transition duration-200"
                disabled={loading}
              >
                {loading
                  ? isEditing
                    ? "Updating..."
                    : "Adding..."
                  : isEditing
                  ? "Update Service"
                  : "Add Service"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg flex-1 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Existing Services
          </h2>

          {services.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                No services found. Add a new service to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {service.name}
                        {service.popular && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </h3>
                      <div className="text-lg font-bold text-gray-700">
                        Ksh. {service.price}
                        {service.discount && (
                          <span className="ml-2 text-sm text-red-600 line-through">
                            Ksh.
                            {(
                              (service.price *
                                (100 + Number(service.discount))) /
                              100
                            ).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded mr-2">
                        {service.category}
                      </span>
                      <span>{service.duration} min</span>
                    </div>

                    {service.tags && service.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {typeof service.tags === "string"
                          ? service.tags.split(",").map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                              >
                                {tag.trim()}
                              </span>
                            ))
                          : service.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                      </div>
                    )}

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {service.description}
                    </p>

                    {service.images?.length > 0 && (
                      <div className="mb-3 grid grid-cols-3 gap-2">
                        {service.images.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${service.name}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                        {service.images.length > 3 && (
                          <div className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            +{service.images.length - 3} more
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleEdit(service)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded flex-1 transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service._id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex-1 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicesManager;
