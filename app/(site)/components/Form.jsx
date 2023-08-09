"use client";
import React, { useEffect } from "react";
import { ArrowRightIcon } from "@sanity/icons";

export const Form = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://web3forms.com/client/script.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <form action="https://api.web3forms.com/submit" method="POST">
        <input
          type="hidden"
          name="access_key"
          value="539f9738-0f6c-44d0-8063-9c3d09f0394f"
        />
        <input
          type="hidden"
          name="subject"
          value="New Submission from Web3Forms on Chasecee.com"
        />
        <input
          type="hidden"
          name="redirect"
          value="https://chasecee.com/success"
        ></input>
        <input
          type="checkbox"
          name="botcheck"
          className="hidden"
          style={{ display: "none" }}
        ></input>

        <div className="flex flex-col gap-8">
          <div className="form-row">
            <label htmlFor="name" className="">
              Your name
            </label>
            <input type="text" name="name" id="name" required />
          </div>
          <div className="form-row">
            <label htmlFor="email" className="">
              Your email
            </label>
            <input type="email" name="email" id="email" required />
          </div>
          <div className="form-row">
            <label htmlFor="message" className="">
              Message
            </label>
            <textarea name="message" id="message" required></textarea>
          </div>
          {/* <div className="form-row">
            <div className="h-captcha" data-captcha="true"></div>
          </div> */}
          <div className="mt-4">
            <button
              type="submit"
              className="item-center group inline-flex flex-row gap-2 rounded-xl border-current bg-blue-800 p-4 px-6 text-white active:translate-y-px dark:text-white"
            >
              Submit Form
              <ArrowRightIcon className="text-[1.6rem] transition-transform group-hover:translate-x-2" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
