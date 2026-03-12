import React from 'react';

export const RulesPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-[#2c2c2c] border-4 border-[#181818] p-8 shadow-lg">
        <h1 className="text-4xl font-vt323 text-[#aa0000] mb-6 text-center border-b-2 border-[#aa0000] pb-2">RULES</h1>
        
        <ul className="list-disc pl-6 space-y-4 font-vt323 text-xl text-gray-300">
          <li><strong className="text-white">No Rating Manipulation:</strong> Creating multiple accounts or using proxies to boost likes/dislikes is strictly prohibited.</li>
          <li><strong className="text-white">Be Respectful:</strong> Insults, harassment, and hate speech in comments are not tolerated.</li>
          <li><strong className="text-white">No Bullying:</strong> Targeted harassment of users or creators will result in a ban.</li>
          <li><strong className="text-white">No External Ads:</strong> Advertising other Minecraft servers or websites is forbidden (except for your own social media links in your profile).</li>
          <li><strong className="text-white">Content Quality:</strong> Uploaded content must be functional and safe. Malware will result in an immediate IP ban.</li>
        </ul>
        
        <div className="mt-8 text-center text-gray-500 font-vt323">
           Violation of these rules may lead to permanent account suspension.
        </div>
      </div>
    </div>
  );
};
