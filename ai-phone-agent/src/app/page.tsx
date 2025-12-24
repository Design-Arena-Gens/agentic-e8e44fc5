"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  AgentState,
  RestaurantProfile,
  agentReply,
  createInitialAgentState,
  openingLine,
} from "@/lib/agent";

type Author = "agent" | "caller";

type ConversationMessage = {
  id: string;
  author: Author;
  text: string;
};

const defaultProfile: RestaurantProfile = {
  name: "Harbor Lights Bistro",
  cuisineType: "Coastal Mediterranean",
  address: "128 Seaside Avenue, Monterey, CA",
  phoneNumber: "(831) 555-0194",
  openingHours: "Monday through Sunday from 11:30 AM to 10:00 PM",
  closedDays: "We close early at 4:00 PM on Sundays.",
  takeawayAvailable: true,
  takeawayMethods:
    "Please call us directly or order through our partner app for delivery. Takeaway orders are typically ready in 25 minutes.",
  popularDishes: [
    {
      id: "grilled-octopus",
      name: "Charred Citrus Octopus",
      description: "Grilled octopus with preserved lemon, smoked paprika, and saffron aioli.",
      price: "$24",
      allergens: "Shellfish",
      tags: ["gluten-free"],
    },
    {
      id: "garden-paella",
      name: "Coastal Garden Paella",
      description: "Saffron rice with seasonal vegetables, roasted tomato sofrito, and herb oil.",
      price: "$28",
      allergens: "Nightshades",
      tags: ["vegetarian", "gluten-free"],
    },
    {
      id: "citrus-halibut",
      name: "Citrus Roasted Halibut",
      description: "Pan-seared halibut with fennel confit, blood orange beurre blanc, and crispy capers.",
      price: "$32",
      allergens: "Fish, Dairy",
    },
    {
      id: "olive-oil-cake",
      name: "Meyer Lemon Olive Oil Cake",
      description: "Light olive oil sponge with mascarpone mousse and candied citrus.",
      price: "$10",
      allergens: "Gluten, Dairy, Eggs",
      tags: ["vegetarian"],
    },
  ],
};

const messageId = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `msg-${counter}`;
  };
})();

const ProfileField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-semibold text-slate-600">{label}</span>
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring focus:ring-slate-200"
    />
  </label>
);

export default function Home() {
  const [profile, setProfile] = useState<RestaurantProfile>(defaultProfile);
  const [callStarted, setCallStarted] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>(createInitialAgentState());
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callEnded = agentState.mode === "ended";

  const startCall = () => {
    const newState = createInitialAgentState();
    setMessages([
      {
        id: messageId(),
        author: "agent",
        text: openingLine(profile),
      },
    ]);
    setAgentState(newState);
    setInputValue("");
    setCallStarted(true);
  };

  const resetCall = () => {
    setMessages([]);
    setAgentState(createInitialAgentState());
    setInputValue("");
    setCallStarted(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || !callStarted) return;

    const callerMessage: ConversationMessage = {
      id: messageId(),
      author: "caller",
      text: trimmed,
    };

    const nextMessages = [...messages, callerMessage];
    const { replies, state } = agentReply(trimmed, agentState, profile);
    const agentMessages = replies.map<ConversationMessage>((reply) => ({
      id: messageId(),
      author: "agent",
      text: reply,
    }));

    setMessages([...nextMessages, ...agentMessages]);
    setAgentState(state);
    setInputValue("");
  };

  const profileSummary = useMemo(
    () => [
      `${profile.name}`,
      `${profile.cuisineType}`,
      `${profile.address}`,
      `Phone: ${profile.phoneNumber}`,
      profile.openingHours,
      profile.closedDays,
    ],
    [profile]
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 lg:flex-row">
        <aside className="w-full rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-md lg:max-w-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            AI Phone Agent Console
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Configure the restaurant profile and start a simulated phone call. The AI assistant will follow service scripts automatically.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            <ProfileField
              label="Restaurant Name"
              value={profile.name}
              onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))}
            />
            <ProfileField
              label="Cuisine Type"
              value={profile.cuisineType}
              onChange={(value) => setProfile((prev) => ({ ...prev, cuisineType: value }))}
            />
            <ProfileField
              label="Address"
              value={profile.address}
              onChange={(value) => setProfile((prev) => ({ ...prev, address: value }))}
            />
            <ProfileField
              label="Phone Number"
              value={profile.phoneNumber}
              onChange={(value) => setProfile((prev) => ({ ...prev, phoneNumber: value }))}
            />
            <ProfileField
              label="Opening Hours"
              value={profile.openingHours}
              onChange={(value) => setProfile((prev) => ({ ...prev, openingHours: value }))}
            />
            <ProfileField
              label="Closed Days"
              value={profile.closedDays}
              placeholder="E.g. Closed on Mondays"
              onChange={(value) => setProfile((prev) => ({ ...prev, closedDays: value }))}
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-600">Takeaway & Delivery Notes</span>
              <textarea
                value={profile.takeawayMethods}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, takeawayMethods: event.target.value }))
                }
                rows={3}
                className="rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring focus:ring-slate-200"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={profile.takeawayAvailable}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, takeawayAvailable: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              Takeaway & Delivery Available
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startCall}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {callStarted ? "Restart Call" : "Start Call"}
            </button>
            <button
              type="button"
              onClick={resetCall}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              Reset
            </button>
          </div>
          <div className="mt-6 rounded-xl bg-slate-100 p-4 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-wide text-slate-500">
              Quick Reference
            </p>
            <ul className="mt-2 space-y-1">
              {profileSummary.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Call Status
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {callStarted ? (callEnded ? "Ended" : "Active") : "Waiting to start"}
              </p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>{profile.name}</p>
              <p>{profile.phoneNumber}</p>
            </div>
          </header>
          <div className="flex flex-1 flex-col justify-between">
            <section className="h-[480px] overflow-y-auto bg-slate-50/60 px-6 py-6">
              <div className="space-y-4">
                {!callStarted && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                    Press &ldquo;Start Call&rdquo; to hear the automated greeting and begin the interaction.
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.author === "agent" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.author === "agent"
                          ? "bg-white text-slate-800 ring-1 ring-slate-200"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      <p className="font-semibold">
                        {message.author === "agent" ? "Assistant" : "Caller"}
                      </p>
                      <p className="mt-1 whitespace-pre-line">{message.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={conversationEndRef} />
              </div>
            </section>
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 bg-white px-6 py-4"
            >
              <label className="flex w-full gap-3">
                <span className="sr-only">Caller input</span>
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder={
                    callStarted
                      ? callEnded
                        ? "The call has ended."
                        : "Type what the caller says..."
                      : "Start the call to enter caller dialogue."
                  }
                  disabled={!callStarted || callEnded}
                className="h-11 flex-1 rounded-full border border-slate-300 px-4 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring focus:ring-slate-200 disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={!callStarted || callEnded || inputValue.trim() === ""}
                  className="h-11 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Send
                </button>
              </label>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
