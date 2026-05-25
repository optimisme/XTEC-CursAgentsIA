document.addEventListener('DOMContentLoaded', () => {
    const attractionsGrid = document.getElementById('attractions-grid');
    const categoryFilter = document.getElementById('category-filter');

    // Data structure based on web search findings
    const gironaAttractions = [
        {
            id: 1,
            name: "Girona Cathedral (Catedral de Girona)",
            description: "A monumental masterpiece of Catalan Gothic architecture. Its immense size and intricate design make it a must-see.",
            category: "Architecture",
            details: "Visiting Hours: Typically 9:00 AM - 6:00 PM (check local listings for specific services).",
            link: "https://www.gironatour.com/en/blog/what-to-see-in-girona",
            source: "Girona Tour"
        },
        {
            id: 2,
            name: "The Old Town (Barri Vell)",
            description: "Wander through the ancient streets, narrow alleys, and historic atmosphere of Girona's heart.",
            category: "History",
            details: "Availability: Always accessible. Best visited during daylight hours.",
            link: "https://www.tripadvisor.com/Attractions-g187499-Activities-Girona_Province_of_Girona_Catalonia.html",
            source: "TripAdvisor"
        },
        {
            id: 3,
            name: "The Onyar Houses",
            description: "Stunning, colorful houses lining the Onyar River. These provide perfect photo opportunities and reflect the city's charm.",
            category: "Scenic",
            details: "Availability: Visible throughout the day.",
            link: "https://www.alongdustyroads.com/posts/things-to-do-in-girona-spain",
            source: "Along Dusty Roads"
        },
        {
            id: 4,
            name: "Arab Baths (Baths of Girona)",
            description: "Step back into history at these ancient baths, offering a glimpse into the city's multicultural past.",
            category: "History",
            details: "Availability: Check specific operational hours for bathing access.",
            link: "https://www.gironatour.com/en/blog/what-to-see-in-girona",
            source: "Girona Tour"
        },
        {
            id: 5,
            name: "Sant Feliu",
            description: "Explore this specific neighborhood or landmark mentioned in guides, offering unique local flavor.",
            category: "History",
            details: "Availability: Varies by attraction details.",
            link: "https://thespaintravelguru.com/things-to-do-in-girona/",
            source: "The Spain Travel Guru"
        }
    ];

    const renderAttractions = (attractions) => {
        if (attractions.length === 0) {
            attractionsGrid.innerHTML = '<p>No attractions found matching the current filter.</p>';
            return;
        }

        const html = attractions.map(attr => {
            const categoryBadge = `<span style="display: block; margin-top: 10px; font-size: 0.85em; color: var(--primary-color);">${attr.category}</span>`;
            return `
                <div class="attraction-card" data-category="${attr.category}">
                    <div class="card-content">
                        <h3>${attr.name}</h3>
                        <p class="description">${attr.description}</p>
                    </div>
                    <div class="details">
                        <p><strong>🕒 Hours:</strong> ${attr.details}</p>
                        <p><strong>🔗 Official Link:</strong> <a href="${attr.link}" target="_blank">${attr.source} Guide</a></p>
                    </div>
                    <a href="${attr.link}" target="_blank" class="link-btn">Visit Guide</a>
                    ${categoryBadge}
                </div>
            `;
        }).join('');

        attractionsGrid.innerHTML = html;
    };

    const handleFilterChange = (event) => {
        const selectedCategory = event.target.value;

        const filteredAttractions = selectedCategory === 'all'
            ? gironaAttractions
            : gironaAttractions.filter(attr => attr.category === selectedCategory);

        renderAttractions(filteredAttractions);
    };

    // Initialize listeners and render
    categoryFilter.addEventListener('change', handleFilterChange);
    
    // Initial render: Show all
    renderAttractions(gironaAttractions);
});
