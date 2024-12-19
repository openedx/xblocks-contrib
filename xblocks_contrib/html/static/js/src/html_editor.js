function HtmlBlockStudio(element) {
    // Find the closest header element from the current element
    const primaryHeader = $(element).closest('.xblock-header-primary');
    console.log('Here', primaryHeader, element)

    // Check if a valid primaryHeader was found
    if (primaryHeader.length === 0) {
        console.error('No matching primary header found for the provided element.');
        return;
    }

    const blockType = primaryHeader.attr('data-block-type');
    console.log('Block type retrieved:', blockType);

    // Construct the initial destination URL
    let destinationUrl = primaryHeader.attr('authoring_MFE_base_url');
    console.log('Base URL retrieved:', destinationUrl);

    destinationUrl += '/' + blockType;
    console.log('URL after adding blockType:', destinationUrl);

    destinationUrl += '/' + encodeURIComponent(primaryHeader.attr('data-usage-id'));
    console.log('URL after adding encoded data-usage-id:', destinationUrl);

    // Check for an upstream reference and append it if present
    const upstreamRef = primaryHeader.attr('data-upstream-ref');
    if (upstreamRef) {
        destinationUrl += '?upstreamLibRef=' + encodeURIComponent(upstreamRef);
        console.log('URL after adding upstreamRef query parameter:', destinationUrl);
    }

    // Final URL before redirection
    console.log('Final destination URL:', destinationUrl);

    // Redirect to the destination URL
    // window.location.href = destinationUrl;
}
