import { ContentLayout } from "@/components/admin-panel/content-layout";
import { getAllTransactions } from "@/app/pay/savePay";

export default async function Page() {
    const data = await getAllTransactions();
    return (
        <ContentLayout title="Transactions">
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            {/* <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th> */}
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                First Name
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Name
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Purpose of Pay
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment Date
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((transaction) => (
                            <tr key={transaction.id}>
                                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.id}</td> */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.first_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.last_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <ul>
                                        {transaction.purposeOfPay.map((purpose, index) => (
                                            <li key={index}>
                                                {purpose.service_name}: {typeof purpose.rate === 'object' ? JSON.stringify(purpose.rate) : purpose.rate}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(transaction.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ContentLayout>
    );
}