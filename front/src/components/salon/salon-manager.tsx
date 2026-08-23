"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Salon, SalonService } from "@/types/salon";

export function SalonManager() {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<SalonService[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [salonPayload, servicePayload] = await Promise.all([
        apiRequest<{ data: { salon: Salon } }>("admin/salon"),
        apiRequest<{ data: SalonService[] }>("admin/services"),
      ]);
      setSalon(salonPayload.data.salon);
      setServices(servicePayload.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load salon management.",
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateSalon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const payload = await apiRequest<{ data: { salon: Salon } }>(
        "admin/salon",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            streetAddress: form.get("streetAddress"),
            city: form.get("city"),
            phone: form.get("phone") || null,
            email: form.get("salonEmail") || null,
          }),
        },
      );
      setSalon(payload.data.salon);
      setMessage("Salon profile saved.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save salon.",
      );
    }
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiRequest("admin/services", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("serviceName"),
          description: form.get("serviceDescription"),
          durationMinutes: Number(form.get("durationMinutes")),
        }),
      });
      formElement.reset();
      setMessage("Service created.");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create service.",
      );
    }
  }

  async function setServiceState(service: SalonService, isActive: boolean) {
    setError("");
    setMessage("");
    try {
      await apiRequest(`admin/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setMessage(isActive ? "Service activated." : "Service deactivated.");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update service.",
      );
    }
  }

  if (!salon && !error)
    return <p className="mt-10 text-stone-600">Loading salon settings…</p>;

  return (
    <div className="mt-10 space-y-8">
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </p>
      ) : null}
      {salon ? (
        <form
          onSubmit={updateSalon}
          className="rounded-2xl border border-stone-200 p-6"
        >
          <h2 className="text-xl font-bold">Salon profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input name="name" label="Salon name" defaultValue={salon.name} />
            <Input name="city" label="City" defaultValue={salon.city} />
            <Input
              name="streetAddress"
              label="Street address"
              defaultValue={salon.streetAddress}
            />
            <Input
              name="phone"
              label="Phone"
              defaultValue={salon.phone ?? ""}
              required={false}
            />
         
            <label className="sm:col-span-2 text-sm font-medium text-stone-700">
              Description
              <textarea
                name="description"
                defaultValue={salon.description}
                rows={4}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </label>
          </div>
          <button className="mt-5 rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">
            Save salon profile
          </button>
        </form>
      ) : null}

      <section className="rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xl font-bold">Services</h2>
        {services.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">No services yet.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex flex-col gap-3 rounded-xl bg-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-stone-600">
                    {service.durationMinutes} min ·{" "}
                    {service.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    void setServiceState(service, !service.isActive)
                  }
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold"
                >
                  {service.isActive ? "Deactivate" : "Activate"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        onSubmit={createService}
        className="rounded-2xl border border-stone-200 p-6"
      >
        <h2 className="text-xl font-bold">Add service</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input name="serviceName" label="Service name" />
          <Input
            name="durationMinutes"
            label="Duration (minutes)"
            type="number"
            min="5"
          />
          <label className="sm:col-span-2 text-sm font-medium text-stone-700">
            Description
            <textarea
              name="serviceDescription"
              rows={3}
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
            />
          </label>
        </div>
        <button className="mt-5 rounded-xl bg-amber-800 px-5 py-3 font-semibold text-white">
          Create service
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-sm font-medium text-stone-700">
      {label}
      <input
        {...props}
        required={props.required ?? true}
        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
      />
    </label>
  );
}
