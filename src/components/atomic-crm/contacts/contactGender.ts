import { FemaleSymbolIcon, MaleSymbolIcon, UserIcon } from "@hugeicons/core-free-icons";

import type { ContactGender } from "../types";

export const contactGender: ContactGender[] = [
  { value: "male", label: "He/Him", icon: MaleSymbolIcon },
  { value: "female", label: "She/Her", icon: FemaleSymbolIcon },
  { value: "nonbinary", label: "They/Them", icon: UserIcon },
];
