/**
 * STARK Icon System
 *
 * Wraps Lucide React icons with consistent sizing and semantic naming.
 * Never use emojis — always use these icons.
 */

import {
  FileText,
  Package,
  Receipt,
  Building2,
  AlertTriangle,
  Check,
  CheckCircle,
  X,
  XCircle,
  Clock,
  Send,
  Eye,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Filter,
  MoreHorizontal,
  ArrowRight,
  Plus,
  Minus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Settings,
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Inbox,
  Bell,
  type LucideIcon,
} from "lucide-react";

// Entity icons
export const PRIcon = FileText;
export const POIcon = Package;
export const InvoiceIcon = Receipt;
export const SupplierIcon = Building2;

// Status icons
export const WarningIcon = AlertTriangle;
export const SuccessIcon = Check;
export const SuccessCircleIcon = CheckCircle;
export const ErrorIcon = X;
export const ErrorCircleIcon = XCircle;
export const PendingIcon = Clock;
export const SentIcon = Send;

// Action icons
export const ViewIcon = Eye;
export const ExpandIcon = ChevronDown;
export const CollapseIcon = ChevronUp;
export const NextIcon = ChevronRight;
export const SearchIcon = Search;
export const FilterIcon = Filter;
export const MoreIcon = MoreHorizontal;
export const ArrowRightIcon = ArrowRight;
export const AddIcon = Plus;
export const RemoveIcon = Minus;
export const EditIcon = Edit;
export const DeleteIcon = Trash2;
export const DownloadIcon = Download;
export const UploadIcon = Upload;
export const RefreshIcon = RefreshCw;
export const SettingsIcon = Settings;

// People icons
export const UserIcon = User;
export const UsersIcon = Users;
export const MailIcon = Mail;
export const PhoneIcon = Phone;
export const LocationIcon = MapPin;

// Data icons
export const CalendarIcon = Calendar;
export const CurrencyIcon = DollarSign;
export const TrendUpIcon = TrendingUp;
export const TrendDownIcon = TrendingDown;
export const ActivityIcon = Activity;
export const ChartIcon = BarChart3;
export const InboxIcon = Inbox;
export const NotificationIcon = Bell;

// Icon sizes following 4px grid
export const iconSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

type IconSize = keyof typeof iconSizes;

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

export function Icon({ icon: LucideIcon, size = "md", className = "" }: IconProps) {
  return (
    <LucideIcon
      size={iconSizes[size]}
      className={className}
      strokeWidth={1.5}
    />
  );
}
