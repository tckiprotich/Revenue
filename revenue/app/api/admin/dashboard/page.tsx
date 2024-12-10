// Importing the JSON data
import data from '@/app/pay/data.json';
import { getTotalRevenue, getTotalTransactions } from '@/app/pay/savePay';
import Collections from '@/app/api/admin/collections/page';


export default function Page() {
    // Calculate the total services by counting entries in `municipal_services`
    const totalServices = data.municipal_services.length;
    const totalRevenue = getTotalRevenue();
    const totalTransactions = getTotalTransactions();

    return (
        <div className="container mx-auto mt-10">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold">Total Revenue</h3>
                        <p className="text-3xl font-semibold mt-2">{totalRevenue}</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold">Total Services</h3>
                    <p className="text-3xl font-semibold mt-2">{totalServices}</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold">No of Transactions</h3>
                    <p className="text-3xl font-semibold mt-2">{totalTransactions}</p>
                </div>
            </div>
            {/* button to redirect to collections page and add/ viewservices page */}
            <div className="mt-6 mb-6">
                <a href="/admin/collections" className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors">View Collections</a>
                <a href="/admin/categories" className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors ml-4">Add Services</a>
                </div>

            {/* Display the collections */}
            <Collections />
        </div>
    );
}
