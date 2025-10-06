import { Button, Rows, Text, Title, LoadingIndicator } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { findAllVisualImages, getDefaultPageDimensions } from "@canva/design";
import * as React from "react";
import * as styles from "styles/components.css";

const BACKEND_URL = "https://interior-checklist.preview.emergentagent.com";