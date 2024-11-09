

// pages/index.tsx

import MunicipalServices from "./MunicipalServices";
import data from "@/app/pay/data.json"; // Adjust the path according to your project structure

const HomePage = () => {
    return (
        <div className="container mx-auto mt-10">
            <MunicipalServices initialServices={data.municipal_services} />
        </div>
    );
};

export default HomePage;