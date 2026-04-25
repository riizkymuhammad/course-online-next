import DataTable from "../ui/table/DataTable";

interface Product {
  id: number;
  name: string;
  variants: string;
  category: string;
  price: string;
  image: string;
  status: "Delivered" | "Pending" | "Canceled";
}

const tableData: Product[] = [
  {
    id: 1,
    name: "MacBook Pro 13in",
    variants: "2 Variants",
    category: "Laptop",
    price: "$2399.00",
    status: "Delivered",
    image: "/images/product/product-01.jpg",
  },
  {
    id: 2,
    name: "Apple Watch Ultra",
    variants: "1 Variant",
    category: "Watch",
    price: "$879.00",
    status: "Pending",
    image: "/images/product/product-02.jpg",
  },
  {
    id: 3,
    name: "iPhone 15 Pro Max",
    variants: "2 Variants",
    category: "SmartPhone",
    price: "$1869.00",
    status: "Delivered",
    image: "/images/product/product-03.jpg",
  },
  {
    id: 4,
    name: "iPad Pro 3rd Gen",
    variants: "2 Variants",
    category: "Electronics",
    price: "$1699.00",
    status: "Canceled",
    image: "/images/product/product-04.jpg",
  },
  {
    id: 5,
    name: "AirPods Pro 2nd Gen",
    variants: "1 Variant",
    category: "Accessories",
    price: "$240.00",
    status: "Delivered",
    image: "/images/product/product-05.jpg",
  },
];

export default function RecentOrders() {
  return (
    <DataTable
      title="Recent Orders"
      description="Data transaksi terbaru dengan pencarian, sorting, dan pagination."
      searchPlaceholder="Search orders..."
      columns={[
        {
          key: "name",
          label: "Products",
          sortable: true,
          type: "imageText",
          imageKey: "image",
          subtitleKey: "variants",
        },
        { key: "category", label: "Category", sortable: true },
        { key: "price", label: "Price", sortable: true },
        {
          key: "status",
          label: "Status",
          sortable: true,
          type: "badge",
          badgeToneMap: {
            Delivered: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
            Pending: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
            Canceled: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
          },
        },
      ]}
      data={tableData}
    />
  );
}
