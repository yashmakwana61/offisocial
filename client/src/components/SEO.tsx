import { Helmet } from "react-helmet-async";

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
}

export const SEO = ({
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle,
    twitterDescription,
    twitterImage,
}: SEOProps) => {
    const siteTitle = "Offisocial";
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const siteUrl = "https://offisocial.com";

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {canonical && <link rel="canonical" href={`${siteUrl}${canonical}`} />}

            {/* Open Graph */}
            <meta property="og:title" content={ogTitle || fullTitle} />
            {ogDescription && <meta property="og:description" content={ogDescription} />}
            {ogImage && <meta property="og:image" content={ogImage} />}

            {/* Twitter */}
            <meta name="twitter:title" content={twitterTitle || fullTitle} />
            {twitterDescription && <meta name="twitter:description" content={twitterDescription} />}
            {twitterImage && <meta name="twitter:image" content={twitterImage} />}
        </Helmet>
    );
};
