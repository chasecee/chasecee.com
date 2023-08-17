import React from "react";
import HeaderMenu from "./components/HeaderMenu";
import LogoDelay from "./components/logo/logo";

export default function Loading() {
  return (
    <div className="container px-4 grayscale-[100%] filter">
      <header className="header mb-10 flex items-center justify-between py-4">
        {/* <HeaderMenu /> */}
        <div className="header_menu flex flex-row gap-5">
          <div className="header_item">
            Work
            <div className="header_item_bar h-[2px] bg-transparent"></div>
          </div>
          <div className="header_item">
            About
            <div className="header_item_bar h-[2px] bg-transparent"></div>
          </div>
          <div className="header_item">
            Contact
            <div className="header_item_bar h-[2px] bg-transparent"></div>
          </div>
        </div>
        <div className="sr-only">Chase Cee Logo</div>
        <LogoDelay />
      </header>
    </div>
  );
}
