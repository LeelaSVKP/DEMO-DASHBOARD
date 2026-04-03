import React, { useState } from "react";
import UploadPage from "../pages/UploadPage";
import "./topbar.css";

export default function TopBar({ user, hideUpload = false, title = "Dashboard" }) {
  const [openUpload, setOpenUpload] = useState(false);

  return (
    <>

      {openUpload && (
        <UploadPage onClose={() => setOpenUpload(false)} />
      )}
    </>
  );
}
